import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import WorkbookList from './workbook-list';

const api = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn() }));
vi.mock('./api', () => ({ workbookApi: api, apiError: () => 'Bağlantı kurulamadı.' }));
describe('lesson catalog', () => {
  it('filters the stored category and exposes draft lessons honestly', async () => {
    api.list.mockResolvedValue([
      { id: 'a', title: 'Ana fikir', summary: 'Dinleme', category: 'listening', status: 'DRAFT' },
      { id: 'b', title: 'Cümle yapısı', summary: 'Dil bilgisi', category: 'grammar', status: 'PUBLISHED' },
    ]);
    render(<MemoryRouter><WorkbookList /></MemoryRouter>);
    await screen.findByText('Ana fikir');
    expect(screen.getByText('Taslak')).toBeInTheDocument();
    expect(screen.queryByText('Cümle yapısı')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Gramer/ }));
    expect(screen.getByText('Cümle yapısı')).toBeInTheDocument();
    expect(screen.queryByText('Ana fikir')).not.toBeInTheDocument();
  });
  it('shows a retry on loading errors, not a false empty catalog', async () => {
    api.list.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    render(<MemoryRouter><WorkbookList /></MemoryRouter>);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Yeniden dene' }));
    await waitFor(() => expect(screen.getByText('Henüz dinleme dersi yok.')).toBeInTheDocument());
  });
});
