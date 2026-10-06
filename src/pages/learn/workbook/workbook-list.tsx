import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Plus } from 'lucide-react';
import { workbookApi, apiError } from './api';
import { categories, statusLabels, type Category, type WorkbookSummary } from './types';
import { filterLessons } from './editor-state';
import './workbook-admin.css';

export default function WorkbookList() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('listening');
  const [items, setItems] = useState<WorkbookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    workbookApi.list().then(data => { if (alive) setItems(data); })
      .catch(err => { if (alive) setError(apiError(err)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [reload]);
  const current = categories.find(item => item.key === category)!;
  const filtered = filterLessons(items, category);
  async function create(event: React.FormEvent) {
    event.preventDefault(); if (!title.trim() || busy) return;
    setBusy(true); setError('');
    try { const lesson = await workbookApi.create(title.trim(), category); navigate(`/learn/workbook/${lesson.id}`); }
    catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  }
  return <main className="workbook-admin">
    <header className="wb-admin-heading"><div><h1>Dersler</h1><p>Video ve çalışma sayfalarını aynı yerde hazırlayın.</p></div>
      <button className="wb-button wb-primary" onClick={() => setCreating(true)}><Plus size={17} /> Ders ekle</button>
    </header>
    <div className="wb-category-tabs" role="tablist" aria-label="Ders bölümü">{categories.map(item =>
      <button key={item.key} role="tab" aria-selected={category === item.key} onClick={() => setCategory(item.key)} style={category === item.key ? { background: item.color } : undefined}>
        {item.label}<span>{items.filter(lesson => lesson.category === item.key).length}</span>
      </button>)}</div>
    {error && <div role="alert" className="wb-alert">{error} {!creating && <button className="wb-button" onClick={() => setReload(value => value + 1)}>Yeniden dene</button>}</div>}
    {loading ? <p role="status" className="wb-empty">Dersler yükleniyor…</p> : !error && filtered.length === 0 ? <div className="wb-empty"><BookOpen size={28} /><p>Henüz {current.label.toLocaleLowerCase('tr-TR')} dersi yok.</p><button className="wb-button" onClick={() => setCreating(true)}>İlk dersi ekle</button></div> :
      <div className="wb-lesson-grid">{filtered.map(lesson => <Link className="wb-lesson-card" to={`/learn/workbook/${lesson.id}`} key={lesson.id}>
        <div className="wb-card-top"><BookOpen size={23} /><span className={`wb-status wb-status-${lesson.status.toLowerCase()}`}>{statusLabels[lesson.status]}</span></div>
        <h2>{lesson.title}</h2><p>{lesson.summary || 'Ders açıklaması henüz eklenmedi.'}</p><span className="wb-card-footer">Düzenle <ArrowUpRight size={17} /></span>
      </Link>)}</div>}
    {creating && <div className="wb-dialog-shade" onClick={event => { if (event.target === event.currentTarget && !busy) setCreating(false); }}>
      <form className="wb-dialog" role="dialog" aria-modal="true" aria-labelledby="new-lesson-title" onSubmit={create}>
        <h2 id="new-lesson-title">Yeni {current.label.toLocaleLowerCase('tr-TR')} dersi</h2>
        <label>Ders adı<input autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={200} required placeholder="Örneğin: Ana fikri bulma" /></label>
        <p>Ders önce taslak olarak kaydedilir. Yayınlayana kadar öğrenciler görmez.</p>
        <div className="wb-actions"><button type="button" className="wb-button" disabled={busy} onClick={() => { setCreating(false); setError(''); }}>Vazgeç</button><button className="wb-button wb-primary" disabled={busy || !title.trim()}>{busy ? 'Oluşturuluyor…' : 'Oluştur'}</button></div>
      </form>
    </div>}
  </main>;
}
