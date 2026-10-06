import type { Category, WorkbookDocument, WorkbookSummary } from './types';

export function editableFingerprint(document: WorkbookDocument): string {
  return JSON.stringify({ title: document.title, summary: document.summary, category: document.category, cover: document.cover, video: document.video, isDemo: document.isDemo, blocks: document.blocks });
}

export function acceptSavedDocument(current: WorkbookDocument, submitted: WorkbookDocument, saved: WorkbookDocument): WorkbookDocument {
  if (current.id !== submitted.id) return current;
  if (editableFingerprint(current) === editableFingerprint(submitted)) return saved;
  return { ...current, revision: saved.revision, updatedAt: saved.updatedAt, status: saved.status };
}

export function filterLessons<T extends WorkbookSummary>(items: T[], category: Category): T[] {
  return items.filter(item => item.category === category);
}
