import { categories, type WorkbookDocument } from './types';

export default function WorkbookMetadata({ document, onChange }: { document: WorkbookDocument; onChange: (document: WorkbookDocument) => void }) {
  const update = (patch: Partial<WorkbookDocument>) => onChange({ ...document, ...patch });
  return <details className="wb-metadata"><summary>Ders bilgileri ve video</summary>
    <p>Bu alandaki değişiklikler kaydettikten sonra çalışma sayfasına yansır.</p>
    <div className="wb-metadata-grid">
      <label>Ders adı<input value={document.title} maxLength={200} onChange={e => update({ title: e.target.value })} /></label>
      <label>Bölüm<select value={document.category} onChange={e => update({ category: e.target.value as WorkbookDocument['category'] })}>{categories.map(item => <option value={item.key} key={item.key}>{item.label}</option>)}</select></label>
      <label className="wb-field-wide">Kısa açıklama<textarea value={document.summary} maxLength={2000} rows={2} onChange={e => update({ summary: e.target.value })} /></label>
      <label>Kapak simgesi<select value={document.cover} onChange={e => update({ cover: e.target.value as WorkbookDocument['cover'] })}>
        <option value="headphones">Kulaklık</option><option value="notes">Notlar</option><option value="choices">Seçenekler</option><option value="conversation">Konuşma</option><option value="gaps">Boşluk doldurma</option><option value="clock">Saat</option>
      </select></label>
      <label>Video türü<select value={document.video?.kind || 'none'} onChange={e => update({ video: e.target.value === 'youtube' ? { kind: 'youtube', id: '' } : e.target.value === 'file' ? { kind: 'file', url: '' } : null })}><option value="none">Video yok</option><option value="youtube">YouTube (geçici kaynak)</option><option value="file">Video bağlantısı</option></select></label>
      {document.video && <label className="wb-field-wide">{document.video.kind === 'youtube' ? 'YouTube video kimliği' : 'Video dosyası bağlantısı'}<input placeholder={document.video.kind === 'youtube' ? '_yTxZWPMurU' : 'https://…/ders.mp4'} value={document.video.kind === 'youtube' ? document.video.id : document.video.url} onChange={e => update({ video: document.video?.kind === 'youtube' ? { kind: 'youtube', id: e.target.value } : { kind: 'file', url: e.target.value } })} /></label>}
      <label className="wb-checkbox"><input type="checkbox" checked={document.isDemo} onChange={e => update({ isDemo: e.target.checked })} /> Örnek / deneme dersi</label>
    </div>
  </details>;
}
