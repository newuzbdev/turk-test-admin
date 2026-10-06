import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Monitor, Save, Smartphone } from 'lucide-react';
import { workbookApi, apiError } from './api';
import { acceptSavedDocument, editableFingerprint } from './editor-state';
import { channel, configuredStudentFrame, protocolVersion, readFrameMessage } from './protocol';
import { statusLabels, type Status, type WorkbookDocument } from './types';
import WorkbookMetadata from './workbook-metadata';
import { publicationError } from './validation-message';
import './workbook-admin.css';

export default function WorkbookEditorPage() {
  const { id = '' } = useParams();
  // Route identity deliberately resets the editing session when opening another lesson.
  return <EditorSession key={id} id={id} />;
}
function EditorSession({ id }: { id: string }) {
  const frameConfig = useMemo(() => configuredStudentFrame(import.meta.env.VITE_STUDENT_APP_URL), []);
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [document, setDocument] = useState<WorkbookDocument | null>(null);
  const documentRef = useRef<WorkbookDocument | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const modeRef = useRef(mode);
  const [phone, setPhone] = useState(false);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const [frameAttempt, setFrameAttempt] = useState(0);
  const [frameError, setFrameError] = useState(false);
  const [media, setMedia] = useState<{ requestId: string; blockId: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const dirty = Boolean(document && editableFingerprint(document) !== savedFingerprint);
  const blocker = useBlocker(dirty || busy || uploading);
  const adopt = useCallback((next: WorkbookDocument) => { documentRef.current = next; setDocument(next); }, []);
  const post = useCallback((message: Record<string, unknown>) => {
    if (frameConfig) iframe.current?.contentWindow?.postMessage({ channel, version: protocolVersion, sessionId, ...message }, frameConfig.origin);
  }, [frameConfig, sessionId]);
  const loadFrame = useCallback((next: WorkbookDocument) => { if (readyRef.current) post({ type: 'load', document: next, mode: modeRef.current }); }, [post]);
  useEffect(() => {
    let alive = true; setLoading(true); setError('');
    workbookApi.get(id).then(next => { if (alive) { adopt(next); setSavedFingerprint(editableFingerprint(next)); } })
      .catch(err => { if (alive) setError(apiError(err)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, reload, adopt]);
  useEffect(() => {
    if (!dirty && !busy && !uploading) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, busy, uploading]);
  useEffect(() => {
    if (!frameConfig || loading || !documentRef.current) return;
    const timer = window.setTimeout(() => { if (!readyRef.current) setFrameError(true); }, 12000);
    const handler = (event: MessageEvent) => {
      const message = readFrameMessage(event, iframe.current?.contentWindow || null, frameConfig.origin, sessionId, id);
      if (!message) return;
      if (message.type === 'ready') {
        readyRef.current = true; setReady(true); setFrameError(false);
        if (documentRef.current) loadFrame(documentRef.current);
      } else if (message.type === 'change' && readyRef.current && modeRef.current === 'edit') {
        const current = documentRef.current;
        if (!current) return;
        // The frame owns blocks only; identity, publication and metadata stay in the admin shell.
        adopt({ ...current, blocks: message.document.blocks }); setNotice('');
      } else if (message.type === 'request-media' && readyRef.current && modeRef.current === 'edit') {
        const blocks = documentRef.current?.blocks;
        const existing = blocks?.find(block => block.id === message.blockId);
        // A new image stays pending in the trusted frame until upload succeeds.
        if (blocks && (existing?.kind === 'image' || (!existing && blocks.length < 200))) setMedia({ requestId: message.requestId, blockId: message.blockId });
      }
    };
    window.addEventListener('message', handler);
    return () => { window.clearTimeout(timer); window.removeEventListener('message', handler); };
  }, [frameConfig, loading, frameAttempt, sessionId, id, loadFrame, adopt]);
  async function save() {
    const submitted = documentRef.current; if (!submitted || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const saved = await workbookApi.save(submitted);
      const next = acceptSavedDocument(documentRef.current || submitted, submitted, saved);
      adopt(next); setSavedFingerprint(editableFingerprint(saved)); loadFrame(next);
      setNotice(editableFingerprint(next) === editableFingerprint(saved) ? 'Değişiklikler kaydedildi.' : 'Kaydedildi. Son yazdıklarınızı da kaydetmeyi unutmayın.');
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  }
  async function changeStatus(status: Status) {
    if (!document || busy || dirty) return;
    if (status === 'PUBLISHED') {
      const missing = publicationError(document);
      if (missing) { setError(missing); return; }
    }
    if (status === 'ARCHIVED' && !window.confirm(`“${document.title}” arşivlensin mi? Öğrenciler artık bu dersi göremeyecek.`)) return;
    setBusy(true); setError('');
    try {
      const saved = await workbookApi.status(document, status);
      const next = acceptSavedDocument(documentRef.current || document, document, saved);
      adopt(next); setSavedFingerprint(editableFingerprint(saved)); loadFrame(next);
      setNotice(status === 'PUBLISHED' ? 'Ders yayınlandı.' : status === 'ARCHIVED' ? 'Ders arşivlendi.' : 'Ders taslağa alındı.');
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  }
  function setEditorMode(next: 'edit' | 'preview') { if (media || uploading) return; modeRef.current = next; setMode(next); post({ type: 'mode', mode: next }); }
  function closeMedia() { if (media) post({ type: 'media-result', requestId: media.requestId, error: 'Görsel seçimi iptal edildi.' }); setMedia(null); }
  async function upload(file: File) {
    if (!media || uploading) return;
    const request = media; setUploading(true); setError('');
    try { const url = await workbookApi.uploadImage(file); post({ type: 'media-result', requestId: request.requestId, url }); setMedia(null); }
    catch (err) { setError(apiError(err)); } finally { setUploading(false); }
  }
  if (loading) return <main className="workbook-admin"><p role="status">Ders yükleniyor…</p></main>;
  if (!document) return <main className="workbook-admin"><Link to="/learn">Derslere dön</Link><p role="alert">{error || 'Ders bulunamadı.'}</p><button className="wb-button" onClick={() => setReload(value => value + 1)}>Yeniden dene</button></main>;
  return <main className="workbook-admin wb-editor-shell">
    <Link className="wb-back" to="/learn"><ArrowLeft size={16} /> Dersler</Link>
    <header className="wb-admin-heading"><div><h1>{document.title || 'Yeni ders'}</h1><p><span className={`wb-status wb-status-${document.status.toLowerCase()}`}>{statusLabels[document.status]}</span> · {dirty ? 'Kaydedilmemiş değişiklikler' : 'Kaydedildi'}</p></div>
      <div className="wb-actions"><button className="wb-button wb-primary" onClick={save} disabled={!dirty || busy || uploading}><Save size={16} /> {busy ? 'İşleniyor…' : 'Kaydet'}</button>
        {document.status === 'DRAFT' && <button className="wb-button" disabled={dirty || busy || uploading} title={dirty ? 'Önce değişiklikleri kaydedin.' : ''} onClick={() => changeStatus('PUBLISHED')}>Yayınla</button>}
        {document.status === 'ARCHIVED' && <button className="wb-button" disabled={dirty || busy || uploading} onClick={() => changeStatus('DRAFT')}>Taslağa geri al</button>}
        {document.status === 'PUBLISHED' && <button className="wb-button" disabled={dirty || busy || uploading} onClick={() => changeStatus('DRAFT')}>Yayından kaldır</button>}
        {document.status !== 'ARCHIVED' && <button className="wb-button" disabled={dirty || busy || uploading} onClick={() => changeStatus('ARCHIVED')}>Arşivle</button>}
      </div>
    </header>
    {document.status === 'PUBLISHED' && <p className="wb-publish-note">Yayınlanan derste kaydettiğiniz değişiklikler öğrencilere de görünür.</p>}
    {error && <div className="wb-alert" role="alert">{error}</div>}
    {notice && <p className="wb-save-notice" role="status"><Check size={16} /> {notice}</p>}
    <WorkbookMetadata document={document} onChange={next => { adopt(next); setNotice(''); }} />
    <div className="wb-editor-toolbar"><div className="wb-segment" aria-label="Düzenleme modu"><button aria-pressed={mode === 'edit'} disabled={Boolean(media) || uploading} onClick={() => setEditorMode('edit')}>Düzenle</button><button aria-pressed={mode === 'preview'} disabled={Boolean(media) || uploading} onClick={() => setEditorMode('preview')}>Öğrenci görünümü</button></div>
      <div className="wb-segment" aria-label="Önizleme genişliği"><button title="Bilgisayar" aria-label="Bilgisayar" aria-pressed={!phone} onClick={() => setPhone(false)}><Monitor size={18} /></button><button title="Telefon" aria-label="Telefon" aria-pressed={phone} onClick={() => setPhone(true)}><Smartphone size={18} /></button></div>
    </div>
    {!frameConfig ? <div className="wb-alert" role="alert">Öğrenci uygulamasının adresi tanımlanmamış. VITE_STUDENT_APP_URL ayarı gerekli.</div> : <>
      {!ready && <div className="wb-frame-wait" role="status">{frameError ? 'Düzenleyiciye bağlanılamadı. Öğrenci uygulamasının açık olduğundan emin olun.' : 'Çalışma sayfası hazırlanıyor…'}{frameError && <button className="wb-button" onClick={() => { readyRef.current = false; setReady(false); setFrameError(false); setFrameAttempt(value => value + 1); }}>Yeniden dene</button>}</div>}
      <div className={`wb-frame-wrap ${phone ? 'is-phone' : ''}`}><iframe ref={iframe} key={frameAttempt} src={frameConfig.url} title="Ders çalışma sayfası düzenleyicisi" allow="fullscreen; autoplay" referrerPolicy="strict-origin-when-cross-origin" /></div>
    </>}
    {media && <div className="wb-dialog-shade"><div className="wb-dialog" role="dialog" aria-modal="true" aria-label="Görsel yükle"><h2>Görsel ekle</h2><p>JPG, PNG, WebP veya GIF · En fazla 10 MB</p><input aria-label="Görsel dosyası" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }} /><p>{uploading ? 'Görsel yükleniyor…' : 'Seçtiğiniz görsel ilgili bloğa eklenecek.'}</p><button className="wb-button" onClick={closeMedia} disabled={uploading}>Vazgeç</button></div></div>}
    {blocker.state === 'blocked' && <div className="wb-dialog-shade"><div className="wb-dialog" role="dialog" aria-modal="true" aria-label="Kaydedilmemiş değişiklikler"><h2>Sayfadan ayrılsın mı?</h2><p>Kaydedilmeyen değişiklikleriniz kaybolabilir.</p><div className="wb-actions"><button className="wb-button" onClick={() => blocker.reset()}>Düzenlemeye devam et</button><button className="wb-button" disabled={busy || uploading} onClick={() => blocker.proceed()}>Kaydetmeden ayrıl</button></div></div></div>}
  </main>;
}
