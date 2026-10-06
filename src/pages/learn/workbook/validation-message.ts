import type { WorkbookDocument } from './types';

// Friendly preflight only; the backend still validates the complete document.
export function publicationError(document: Pick<WorkbookDocument, 'summary' | 'video' | 'blocks'>): string | null {
  if (!document.summary.trim()) return readableWorkbookError('Published workbook summary is required');
  if (!document.blocks.length) return readableWorkbookError('Published workbook must contain at least one block');
  for (const block of document.blocks) {
    if (block.kind === 'blank' && !block.acceptedAnswers?.some(answer => answer.trim())) return 'Boşluk doldurma alıştırmasının doğru cevabını ekleyin.';
    if (block.kind === 'choice' && !block.options.some(option => option.id === block.correctOptionId)) return 'Seçenekli alıştırmada doğru cevabı seçin.';
  }
  return null;
}

export function readableWorkbookError(message: string) {
  const publication: Record<string, string> = {
    'Published workbook summary is required': 'Yayınlamadan önce kısa ders açıklamasını ekleyin.',
    'Published workbook video is required': 'Yayınlamadan önce ders videosunu ekleyin.',
    'Published workbook must contain at least one block': 'Yayınlamadan önce en az bir ders içeriği ekleyin.',
  };
  if (publication[message]) return publication[message];
  if (/^Blank block .+ requires acceptedAnswers before publishing$/.test(message)) return 'Boşluk doldurma alıştırmasının doğru cevabını ekleyin.';
  if (/^Choice block .+ requires correctOptionId before publishing$/.test(message)) return 'Seçenekli alıştırmada doğru cevabı seçin.';
  return message;
}
