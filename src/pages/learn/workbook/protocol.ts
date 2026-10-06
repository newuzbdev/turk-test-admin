import { categories, type WorkbookDocument } from './types';

export const channel = 'turkishmock-lesson-editor';
export const protocolVersion = 1;
export function configuredStudentFrame(value: string | undefined) {
  try {
    if (!value) return null;
    const url = new URL(value);
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (url.username || url.password || !(url.protocol === 'https:' || (url.protocol === 'http:' && local))) return null;
    return { origin: url.origin, url: new URL('/lesson-editor', url.origin).href };
  } catch { return null; }
}

type Ready = { type: 'ready' };
type Change = { type: 'change'; document: WorkbookDocument };
type MediaRequest = { type: 'request-media'; requestId: string; blockId: string };
type FrameMessage = Ready | Change | MediaRequest;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 50_000;
const strings = (value: unknown) => Array.isArray(value) && value.length <= 100 && value.every(text);
const tone = (value: unknown) => ['plain', 'gray', 'green', 'yellow'].includes(String(value));
const identified = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 150;
const keys = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
const optionalText = (value: unknown) => value === undefined || text(value);
const optionalId = (value: unknown) => value === undefined || identified(value);
const blockFields: Record<string, string[]> = {
  heading: ['text', 'level'], text: ['text'], quote: ['text'], tip: ['title', 'text'], image: ['url', 'alt', 'caption'],
  table: ['headers', 'rows'], reflection: ['title', 'instruction', 'exampleAnswer', 'checklist'],
  blank: ['title', 'instruction', 'before', 'after', 'acceptedAnswers', 'explanation', 'exerciseId', 'questionId'],
  choice: ['title', 'instruction', 'options', 'correctOptionId', 'explanation', 'exerciseId', 'questionId'],
};

function validStyle(value: unknown): boolean {
  if (value === undefined) return true;
  if (!record(value) || !keys(value, ['textColor', 'backgroundColor', 'fontSize', 'textAlign', 'width'])) return false;
  const color = (input: unknown) => input === undefined || (typeof input === 'string' && /^#[0-9a-f]{6}$/i.test(input));
  const integer = (input: unknown, min: number, max: number) => input === undefined || (typeof input === 'number' && Number.isInteger(input) && input >= min && input <= max);
  return color(value.textColor) && color(value.backgroundColor) && integer(value.fontSize, 12, 48) && integer(value.width, 25, 100)
    && (value.textAlign === undefined || (typeof value.textAlign === 'string' && ['left', 'center', 'right', 'justify'].includes(value.textAlign)));
}

function validBlock(value: unknown): boolean {
  if (!record(value) || !identified(value.id) || !tone(value.tone)) return false;
  if (typeof value.kind !== 'string' || !Object.hasOwn(blockFields, value.kind) || !keys(value, ['id', 'kind', 'tone', 'style', ...blockFields[value.kind]]) || !validStyle(value.style)) return false;
  if (!optionalText(value.explanation) || !optionalId(value.exerciseId) || !optionalId(value.questionId)) return false;
  switch (value.kind) {
    case 'heading': return text(value.text) && (value.level === 2 || value.level === 3);
    case 'text': case 'quote': return text(value.text);
    case 'tip': return text(value.title) && text(value.text);
    case 'image': return text(value.url) && text(value.alt) && text(value.caption);
    case 'table': return strings(value.headers) && Array.isArray(value.rows) && value.rows.length <= 100 && value.rows.every(row => record(row) && keys(row, ['id', 'cells', 'tone']) && identified(row.id) && strings(row.cells) && tone(row.tone));
    case 'reflection': return text(value.title) && text(value.instruction) && text(value.exampleAnswer) && strings(value.checklist);
    case 'blank': return text(value.title) && text(value.instruction) && text(value.before) && text(value.after) && (value.acceptedAnswers === undefined || strings(value.acceptedAnswers));
    case 'choice': return text(value.title) && text(value.instruction) && Array.isArray(value.options) && value.options.length <= 100 && value.options.every(option => record(option) && keys(option, ['id', 'text']) && identified(option.id) && text(option.text)) && (value.correctOptionId === undefined || text(value.correctOptionId));
    default: return false;
  }
}

export function isWorkbookDocument(value: unknown): value is WorkbookDocument {
  if (!record(value)) return false;
  if (!keys(value, ['id', 'slug', 'title', 'summary', 'category', 'cover', 'video', 'isDemo', 'status', 'revision', 'updatedAt', 'blocks'])) return false;
  return identified(value.id) && identified(value.slug) && text(value.title) && text(value.summary)
    && categories.some(category => category.key === value.category)
    && ['headphones', 'notes', 'choices', 'conversation', 'gaps', 'clock'].includes(String(value.cover))
    && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(String(value.status))
    && typeof value.isDemo === 'boolean' && Number.isSafeInteger(value.revision) && Number(value.revision) >= 0 && text(value.updatedAt)
    && (value.video === null || (record(value.video) && ((value.video.kind === 'youtube' && keys(value.video, ['kind', 'id']) && text(value.video.id)) || (value.video.kind === 'file' && keys(value.video, ['kind', 'url']) && text(value.video.url)))))
    && Array.isArray(value.blocks) && value.blocks.length <= 200 && value.blocks.every(validBlock)
    && new Set(value.blocks.map(block => block.id)).size === value.blocks.length;
}

export function readFrameMessage(event: { source: unknown; origin: string; data: unknown }, source: Window | null, origin: string, sessionId: string, lessonId: string): FrameMessage | null {
  if (!source || event.source !== source || event.origin !== origin || !record(event.data)) return null;
  const data = event.data;
  try { if (JSON.stringify(data).length > 2_000_000) return null; } catch { return null; }
  if (data.channel !== channel || data.version !== protocolVersion) return null;
  const envelope = ['channel', 'version', 'type'];
  if (data.type === 'ready') return keys(data, envelope) ? { type: 'ready' } : null;
  if (data.sessionId !== sessionId) return null;
  if (data.type === 'request-media' && keys(data, [...envelope, 'sessionId', 'requestId', 'blockId']) && identified(data.requestId) && identified(data.blockId)) return { type: 'request-media', requestId: data.requestId as string, blockId: data.blockId as string };
  if (data.type === 'change' && keys(data, [...envelope, 'sessionId', 'document'])) {
    if (isWorkbookDocument(data.document) && data.document.id === lessonId) return { type: 'change', document: data.document };
  }
  return null;
}
