export const categories = [
  { key: 'listening', label: 'Dinleme', color: '#dbeddb' },
  { key: 'reading', label: 'Okuma', color: '#d3e5ef' },
  { key: 'writing', label: 'Yazma', color: '#f5e0e9' },
  { key: 'speaking', label: 'Konuşma', color: '#fdecc8' },
  { key: 'grammar', label: 'Gramer', color: '#e8deee' },
] as const;
export type Category = typeof categories[number]['key'];
export type Tone = 'plain' | 'gray' | 'green' | 'yellow';
export type Cover = 'headphones' | 'notes' | 'choices' | 'conversation' | 'gaps' | 'clock';
export type VideoSource = { kind: 'youtube'; id: string } | { kind: 'file'; url: string };
export type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type WorkbookStyle = {
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  width?: number;
};
export type Block = { id: string; tone: Tone; style?: WorkbookStyle } & (
  | { kind: 'heading'; text: string; level: 2 | 3 }
  | { kind: 'text' | 'quote'; text: string }
  | { kind: 'tip'; title: string; text: string }
  | { kind: 'image'; url: string; alt: string; caption: string }
  | { kind: 'table'; headers: string[]; rows: { id: string; cells: string[]; tone: Tone }[] }
  | { kind: 'blank'; title: string; instruction: string; before: string; after: string; acceptedAnswers?: string[]; explanation?: string; exerciseId?: string; questionId?: string }
  | { kind: 'choice'; title: string; instruction: string; options: { id: string; text: string }[]; correctOptionId?: string; explanation?: string; exerciseId?: string; questionId?: string }
  | { kind: 'reflection'; title: string; instruction: string; exampleAnswer: string; checklist: string[] }
);
export interface WorkbookDocument {
  id: string; slug: string; title: string; summary: string; category: Category; cover: Cover;
  video: VideoSource | null; isDemo: boolean; status: Status; revision: number; updatedAt: string; blocks: Block[];
}
export type WorkbookSummary = Omit<WorkbookDocument, 'blocks'>;
export const statusLabels: Record<Status, string> = { DRAFT: 'Taslak', PUBLISHED: 'Yayında', ARCHIVED: 'Arşivde' };
