import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkbookEditorPage from './workbook-editor-page';
import type { WorkbookDocument } from './types';

const api = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), status: vi.fn() }));
vi.mock('./api', () => ({ workbookApi: api, apiError: () => 'Kaydedilemedi. Yazdıklarınız korunuyor.' }));
const original: WorkbookDocument = { id: 'a', slug: 'listening-1', title: 'İlk ders', summary: '', category: 'listening', cover: 'notes', video: null, isDemo: true, status: 'DRAFT', revision: 1, updatedAt: '2026-09-06T00:00:00Z', blocks: [] };
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(res => { resolve = res; }); return { promise, resolve }; };
function mount() { const router = createMemoryRouter([{ path: '/learn/workbook/:id', element: <WorkbookEditorPage /> }], { initialEntries: ['/learn/workbook/a'] }); return render(<RouterProvider router={router} />); }
beforeEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); vi.stubEnv('VITE_STUDENT_APP_URL', 'http://127.0.0.1:5175'); api.get.mockResolvedValue(original); });
describe('admin save lifecycle', () => {
  it('opens media selection for a new image and keeps edit mode until selection completes', async () => {
    mount();
    const iframe = await screen.findByTitle('Ders çalışma sayfası düzenleyicisi') as HTMLIFrameElement;
    const post = vi.spyOn(iframe.contentWindow!, 'postMessage');
    const envelope = { channel: 'turkishmock-lesson-editor', version: 1 };
    fireEvent(window, new MessageEvent('message', { source: iframe.contentWindow, origin: 'http://127.0.0.1:5175', data: { ...envelope, type: 'ready' } }));
    const load = post.mock.calls.find(call => call[0].type === 'load')?.[0];
    expect(load?.sessionId).toBeTruthy();
    fireEvent(window, new MessageEvent('message', { source: iframe.contentWindow, origin: 'http://127.0.0.1:5175', data: { ...envelope, type: 'request-media', sessionId: load.sessionId, requestId: 'request-new', blockId: 'new-image' } }));
    expect(screen.getByRole('dialog', { name: 'Görsel yükle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Öğrenci görünümü' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(screen.queryByRole('dialog', { name: 'Görsel yükle' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Öğrenci görünümü' })).toBeEnabled();
    expect(post).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'media-result', requestId: 'request-new', error: expect.any(String) }), 'http://127.0.0.1:5175');
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled();
  });
  it('offers restoring an archived lesson to draft before publishing', async () => {
    api.get.mockResolvedValue({ ...original, status: 'ARCHIVED' });
    api.status.mockResolvedValue({ ...original, revision: 2 }); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Taslağa geri al' }));
    await waitFor(() => expect(api.status).toHaveBeenCalledWith(expect.objectContaining({ status: 'ARCHIVED' }), 'DRAFT'));
  });
  it('retains dirty input after a failed save and enables retry', async () => {
    api.save.mockRejectedValue(new Error('offline')); mount();
    const title = await screen.findByLabelText('Ders adı');
    fireEvent.change(title, { target: { value: 'Yeni başlık' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await screen.findByText('Kaydedilemedi. Yazdıklarınız korunuyor.');
    expect(title).toHaveValue('Yeni başlık');
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Yayınla' })).toBeDisabled();
  });
  it('keeps edits typed during a save while advancing the server revision', async () => {
    const save = deferred<WorkbookDocument>(); api.save.mockReturnValue(save.promise); mount();
    const title = await screen.findByLabelText('Ders adı');
    fireEvent.change(title, { target: { value: 'Kaydedilen başlık' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    fireEvent.change(title, { target: { value: 'Son yazılan başlık' } });
    await act(async () => save.resolve({ ...original, title: 'Kaydedilen başlık', revision: 2 }));
    expect(title).toHaveValue('Son yazılan başlık');
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => expect(api.save).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Son yazılan başlık', revision: 2 })));
  });
  it('does not discard edits made while publishing', async () => {
    api.get.mockResolvedValue({ ...original, summary: 'Açıklama', video: { kind: 'youtube', id: '_yTxZWPMurU' }, blocks: [{ id: 'text', kind: 'text', tone: 'plain', text: 'Ders' }] });
    const publish = deferred<WorkbookDocument>(); api.status.mockReturnValue(publish.promise); mount();
    const title = await screen.findByLabelText('Ders adı');
    fireEvent.click(screen.getByRole('button', { name: 'Yayınla' }));
    expect(api.status).toHaveBeenCalledOnce();
    fireEvent.change(title, { target: { value: 'Son değişiklik' } });
    await act(async () => publish.resolve({ ...original, status: 'PUBLISHED', revision: 2 }));
    expect(title).toHaveValue('Son değişiklik');
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeEnabled();
  });
});
