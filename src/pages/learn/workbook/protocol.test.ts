import { describe, expect, it } from 'vitest';
import { configuredStudentFrame, isWorkbookDocument, readFrameMessage } from './protocol';
import { acceptSavedDocument, editableFingerprint, filterLessons } from './editor-state';

const document = { id: 'lesson-1', slug: 'listening-1', title: 'Ana fikir', summary: '', category: 'listening' as const, cover: 'notes' as const, video: null, isDemo: true, status: 'DRAFT' as const, revision: 1, updatedAt: '2026-09-06T00:00:00.000Z', blocks: [] };

describe('Workbook admin boundary', () => {
  it('accepts bounded page styles but rejects arbitrary CSS and invalid values', () => {
    const block = { id: 'text', kind: 'text', text: 'Ders', tone: 'plain' };
    const style = { textColor: '#37352f', backgroundColor: '#EAF6EF', fontSize: 18, textAlign: 'center', width: 75 };
    expect(isWorkbookDocument({ ...document, blocks: [{ ...block, style }] })).toBe(true);
    expect(isWorkbookDocument({ ...document, blocks: [{ ...block, style: { textAlign: Object('left') } }] })).toBe(false);
    for (const invalid of [null, 'color:red', { textColor: 'red' }, { backgroundColor: 'url(x)' }, { fontSize: 11 }, { fontSize: 49 }, { fontSize: 14.5 }, { width: 24 }, { width: 101 }, { width: '50' }, { textAlign: 'absolute' }, { position: 'fixed' }]) {
      expect(isWorkbookDocument({ ...document, blocks: [{ ...block, style: invalid }] })).toBe(false);
    }
  });

  it('refuses missing, unsafe and credential-bearing iframe origins', () => {
    for (const value of ['', 'javascript:alert(1)', '//evil.example', 'https://name:password@example.com', 'http://example.com']) expect(configuredStudentFrame(value)).toBeNull();
    expect(configuredStudentFrame('http://127.0.0.1:5175/')).toEqual({ origin: 'http://127.0.0.1:5175', url: 'http://127.0.0.1:5175/lesson-editor' });
    expect(configuredStudentFrame('https://students.example')).toEqual({ origin: 'https://students.example', url: 'https://students.example/lesson-editor' });
  });

  it('accepts only the configured frame window, origin, protocol and current lesson session', () => {
    const source = {} as Window;
    const data = { channel: 'turkishmock-lesson-editor', version: 1, type: 'change', sessionId: 'session-1', document };
    const event = { source, origin: 'https://students.example', data };
    const read = (value: typeof event) => readFrameMessage(value, source, event.origin, 'session-1', document.id);
    expect(read(event)?.type).toBe('change');
    expect(read({ ...event, source: {} as Window })).toBeNull();
    expect(read({ ...event, origin: 'https://other.example' })).toBeNull();
    expect(read({ ...event, data: { ...data, version: 2 } })).toBeNull();
    expect(read({ ...event, data: { ...data, sessionId: 'old-session' } })).toBeNull();
    expect(read({ ...event, data: { ...data, document: { ...document, id: 'other-lesson' } } })).toBeNull();
    expect(read({ ...event, data: { ...data, document: { ...document, blocks: [{ id: 'bad', kind: 'html', tone: 'plain' }] } } as never })).toBeNull();
  });

  it('keeps edits typed during a save while advancing the server revision', () => {
    const working = { ...document, title: 'Sonradan yazılan başlık' };
    const saved = { ...document, revision: 2, updatedAt: '2026-09-06T00:01:00.000Z' };
    const next = acceptSavedDocument(working, document, saved);
    expect(next.title).toBe('Sonradan yazılan başlık');
    expect(next.revision).toBe(2);
    expect(editableFingerprint(next)).not.toBe(editableFingerprint(saved));
    expect(acceptSavedDocument(document, document, saved)).toEqual(saved);
  });

  it('rejects unknown fields, coerced values and malformed optional block fields', () => {
    const source = {} as Window;
    const read = (data: unknown) => readFrameMessage({ source, origin: 'https://students.example', data }, source, 'https://students.example', 's', document.id);
    const base = { channel: 'turkishmock-lesson-editor', version: 1, type: 'change', sessionId: 's', document };
    expect(read({ ...base, extra: true })).toBeNull();
    expect(read({ channel: base.channel, version: 1, type: 'ready', padding: 'x'.repeat(2_000_001) })).toBeNull();
    const block = { id: 'x', kind: 'blank', tone: 'plain', title: '', instruction: '', before: '', after: '', acceptedAnswers: ['ana fikir'] };
    for (const invalid of [{ ...block, explanation: 7 }, { ...block, exerciseId: {} }, { ...block, questionId: false }, { ...block, unknown: 'field' }, { id: 'x', kind: 'heading', tone: 'plain', text: 'Başlık', level: '2' }]) {
      expect(read({ ...base, document: { ...document, blocks: [invalid] } })).toBeNull();
    }
  });

  it('ignores server timestamp changes for dirty state and filters by the stored category', () => {
    expect(editableFingerprint({ ...document, revision: 9, updatedAt: 'later' })).toBe(editableFingerprint(document));
    const misleading = { ...document, id: 'other', category: 'writing' as const, title: 'Dinleme başlığı' };
    expect(filterLessons([document, misleading], 'listening').map(item => item.id)).toEqual(['lesson-1']);
  });
});
