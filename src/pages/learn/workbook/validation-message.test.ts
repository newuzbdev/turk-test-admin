import { describe, expect, it } from 'vitest';
import { publicationError, readableWorkbookError } from './validation-message';
describe('Turkish workbook error messages', () => {
  it('explains publication prerequisites without storage terminology', () => {
    expect(readableWorkbookError('Published workbook must contain at least one block')).toBe('Yayınlamadan önce en az bir ders içeriği ekleyin.');
    expect(readableWorkbookError('Blank block abc requires acceptedAnswers before publishing')).toBe('Boşluk doldurma alıştırmasının doğru cevabını ekleyin.');
    expect(readableWorkbookError('Published workbook video is required')).toBe('Yayınlamadan önce ders videosunu ekleyin.');
  });
  it('checks only missing publication prerequisites before making the request', () => {
    const base = { summary: 'Açıklama', video: { kind: 'youtube' as const, id: '_yTxZWPMurU' }, blocks: [] };
    expect(publicationError(base)).toBe('Yayınlamadan önce en az bir ders içeriği ekleyin.');
    expect(publicationError({ ...base, blocks: [{ id: 'b1', kind: 'blank', tone: 'plain', title: 'Soru', instruction: '', before: '', after: '', acceptedAnswers: [] }] })).toBe('Boşluk doldurma alıştırmasının doğru cevabını ekleyin.');
    expect(publicationError({ ...base, blocks: [{ id: 't1', kind: 'text', tone: 'plain', text: 'Ders içeriği' }] })).toBeNull();
  });
  it('allows text lessons without video while retaining content and answer checks', () => {
    const base = { summary: 'Resmî e-posta dersi', video: null, blocks: [] };
    expect(publicationError(base)).toBe('Yayınlamadan önce en az bir ders içeriği ekleyin.');
    expect(publicationError({ ...base, summary: '' })).toBe('Yayınlamadan önce kısa ders açıklamasını ekleyin.');
    expect(publicationError({ ...base, blocks: [{ id: 't1', kind: 'text', tone: 'plain', text: 'Ders içeriği' }] })).toBeNull();
    expect(publicationError({ ...base, blocks: [{ id: 'c1', kind: 'choice', tone: 'plain', title: 'Hitap', instruction: 'Seçin', options: [{ id: 'o1', text: 'Sayın Yetkili' }] }] })).toBe('Seçenekli alıştırmada doğru cevabı seçin.');
  });
});
