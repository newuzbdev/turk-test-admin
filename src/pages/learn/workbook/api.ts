import axios from 'axios';
import axiosPrivate from '@/config/api';
import { createFileAccessUrl } from '@/config/queries/file/upload.queries';
import type { Category, Status, WorkbookDocument, WorkbookSummary } from './types';
import { readableWorkbookError } from './validation-message';

const endpoint = '/api/admin/learn/workbook-lessons';
function unwrap<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'success' in value && 'data' in value) return value.data as T;
  return value as T;
}
export const workbookApi = {
  async list() { return unwrap<{ data: WorkbookSummary[] }>((await axiosPrivate.get(endpoint)).data).data; },
  async create(title: string, category: Category) { return unwrap<WorkbookDocument>((await axiosPrivate.post(endpoint, { title, category })).data); },
  async get(id: string) { return unwrap<WorkbookDocument>((await axiosPrivate.get(`${endpoint}/${encodeURIComponent(id)}`)).data); },
  async save(document: WorkbookDocument) { return unwrap<WorkbookDocument>((await axiosPrivate.put(`${endpoint}/${encodeURIComponent(document.id)}`, { document, expectedRevision: document.revision })).data); },
  async status(document: WorkbookDocument, status: Status) { return unwrap<WorkbookDocument>((await axiosPrivate.patch(`${endpoint}/${encodeURIComponent(document.id)}/status`, { expectedRevision: document.revision, status })).data); },
  async uploadImage(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('JPG, PNG, WebP veya GIF görseli seçin.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Görsel en fazla 10 MB olabilir.');
    const body = new FormData(); body.append('file', file);
    const response = (await axiosPrivate.post('/api/file/upload', body)).data;
    const data = unwrap<{ reference?: string; url?: string }>(response);
    if (data.url) return data.url;
    const reference = data.reference || response.path;
    if (!reference) throw new Error('Görsel adresi alınamadı.');
    const url = await createFileAccessUrl(reference);
    if (!url) throw new Error('Görsel bağlantısı oluşturulamadı.');
    return url;
  },
};
export function apiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) return 'Bu ders başka bir yerde değiştirildi. Yazdıklarınız burada korunuyor. İçeriğinizi kopyaladıktan sonra sayfayı yenileyip tekrar düzenleyin.';
    if (error.response?.status === 400) return 'Ders bilgileri kabul edilmedi. Zorunlu alanları, bağlantıları ve alıştırma cevaplarını kontrol edin. Yazdıklarınız korunuyor.';
    const message = error.response?.data?.message || error.response?.data?.error?.message || error.response?.data?.error;
    if (typeof message === 'string') return readableWorkbookError(message);
    if (Array.isArray(message)) return message.map(item => readableWorkbookError(String(item))).join(' ');
    return error.response ? 'İşlem tamamlanamadı. Yazdıklarınız korunuyor; yeniden deneyebilirsiniz.' : 'Sunucuya bağlanılamadı. Yazdıklarınız korunuyor; yeniden deneyebilirsiniz.';
  }
  return error instanceof Error ? error.message : 'İşlem tamamlanamadı. Yeniden deneyin.';
}
