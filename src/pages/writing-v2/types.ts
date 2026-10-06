import type { WritingTest } from "@/utils/types/types";

export type WritingTaskCode = "TASK_1_1" | "TASK_1_2" | "TASK_2";

export type RichTextDocument = Record<string, unknown>;

export type WritingTaskV2Payload = {
  taskCode: WritingTaskCode;
  promptJson: RichTextDocument;
  register: string;
  genre: string;
  targetLevel: string;
  wordMin: number;
  wordMax: number;
  maxRawScore: number;
};

export type WritingTestV2Payload = {
  ieltsId: string;
  title: string;
  instruction: string;
  sourceEmail: RichTextDocument;
  durationMinutes: number;
  tasks: WritingTaskV2Payload[];
};

export type WritingTestV2 = WritingTest & {
  id: string;
  formatVersion: 2;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  durationMinutes: number;
  sourceEmail: RichTextDocument;
};

export const EMPTY_RICH_TEXT_DOCUMENT: RichTextDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const WRITING_TASK_DEFINITIONS = [
  {
    taskCode: "TASK_1_1",
    label: "Görev 1.1",
    partLabel: "Bölüm 1",
    description: "50 kelimelik gayriresmî mektup",
    register: "Gayriresmî",
    genre: "Mektup",
    targetLevel: "B1",
    wordMin: 50,
    wordMax: 50,
    maxRawScore: 5,
  },
  {
    taskCode: "TASK_1_2",
    label: "Görev 1.2",
    partLabel: "Bölüm 1",
    description: "120-150 kelimelik resmî mektup",
    register: "Resmî",
    genre: "Mektup",
    targetLevel: "B2",
    wordMin: 120,
    wordMax: 150,
    maxRawScore: 5,
  },
  {
    taskCode: "TASK_2",
    label: "Görev 2",
    partLabel: "Bölüm 2",
    description: "180-200 kelimelik blog, forum veya dergi yazısı",
    register: "Görevde belirtilen okur ve yayın türüne uygun üslup",
    genre: "Blog/forum/dergi yazısı",
    targetLevel: "C1",
    wordMin: 180,
    wordMax: 200,
    maxRawScore: 6,
  },
] as const satisfies ReadonlyArray<{
  taskCode: WritingTaskCode;
  label: string;
  partLabel: string;
  description: string;
  register: string;
  genre: string;
  targetLevel: string;
  wordMin: number;
  wordMax: number;
  maxRawScore: number;
}>;
