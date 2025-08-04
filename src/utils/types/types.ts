// Question Type Enum
export enum QuestionType {
  TEXT_INPUT = "TEXT_INPUT",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  MULTI_SELECT = "MULTI_SELECT",
  MATCHING = "MATCHING",
  TRUE_FALSE = "TRUE_FALSE",
  FILL_BLANK = "FILL_BLANK",
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TPaginationWrapper<T> {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
// IELTS Interface
export interface IELTS {
  id?: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

// Test Interfaces
export interface Test {
  id?: string;
  title: string;
  type: string;
  ieltsId: string;
  createdAt?: string;
  updatedAt?: string;
  parts?: Part[];
}

export interface OnlyTest {
  id?: string;
  title: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

// Parts Interface
export interface Part {
  id?: string;
  title: string;
  testId?: string;
  order?: number;
  number: number;
  audioUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  sections?: Section[];
}

// Section Interface
export interface Section {
  id?: string;
  title: string;
  content?: string;
  partId: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  questions?: Question[];
}

// Question Interface
export interface Question {
  id?: string;
  question: string;
  type: string;
  sectionId: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  answers?: Answer[];
}

// Answer Interface
export interface Answer {
  id?: string;
  answer: string;
  isCorrect: boolean;
  questionId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Exam Interfaces
export interface ExamSubmission {
  testId: string;
  answers: {
    questionId: string;
    answerId: string;
  }[];
}

export interface ExamResult {
  id?: string;
  userId: string;
  testId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  createdAt?: string;
}

export interface UserAnswer {
  id?: string;
  userId: string;
  questionId: string;
  answerId: string;
  isCorrect: boolean;
  createdAt?: string;
}

// Speaking Test Interfaces
export interface SpeakingTest {
  id?: string;
  title: string;
  ieltsId: string;
  ielts?: IELTS;
  createdAt?: string;
  updatedAt?: string;
  sections?: SpeakingSection[];
}

export interface OnlySpeakingTest {
  id?: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpeakingSection {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  order: number;
  type: string;
  speakingTestId: string;
  images?: string[];
  advantages?: string[];
  disadvantages?: string[];
  createdAt?: string;
  updatedAt?: string;
  subParts?: SpeakingSubPart[];
  questions?: SpeakingQuestion[];
  points?: SpeakingPoint[];
}

export interface SpeakingSubPart {
  id?: string;
  label: string;
  description: string;
  speakingSectionId: string;
  order: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  questions?: SpeakingQuestion[];
}

export interface SpeakingQuestion {
  id?: string;
  question: string;
  order: number;
  speakingSubPartId?: string;
  speakingSectionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpeakingPoint {
  id?: string;
  order: number;
  type: "ADVANTAGE" | "DISADVANTAGE";
  speakingSectionId: string;
  createdAt?: string;
  updatedAt?: string;
  questions?: SpeakingQuestion[];
}

// Create DTOs for Speaking Tests
export interface CreateSpeakingTestDTO {
  title: string;
  ieltsId: string;
  sections: CreateSpeakingSectionDTO[];
}

export interface CreateOnlySpeakingTestDTO {
  title: string;
  ieltsId: string;
}
export interface CreateSpeakingSectionDTO {
  order: number;
  type: string;
  title: string;
  description: string;
  content: string;
  images: string[];
  subParts: CreateSpeakingSubPartDTO[];
  points?: CreateSpeakingPointDTO[];
}
export interface CreateSpeakingSubPartDTO {
  label: string;
  description: string;
  images: string[];
  questions: CreateSpeakingQuestion[];
}

export interface CreateSpeakingQuestion {
  order: number;
  question: string;
}

export interface CreateSpeakingPointDTO {
  order: number;
  type: "ADVANTAGE" | "DISADVANTAGE";
  questions: CreateSpeakingQuestion[];
}

// Writing Test Interfaces
export interface WritingTest {
  id?: string;
  title: string;
  instruction?: string;
  ieltsId: string;
  createdAt?: string;
  updatedAt?: string;
  sections?: WritingSection[];
}

export interface WritingSection {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  order: number;
  writingTestId: string;
  createdAt?: string;
  updatedAt?: string;
  subParts?: WritingSubPart[];
  questions?: WritingQuestion[]; // Add support for direct questions
}

export interface WritingSubPart {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  order: number;
  writingSectionId: string;
  createdAt?: string;
  updatedAt?: string;
  questions?: WritingQuestion[]; // Add support for questions in subParts too
}

export interface WritingQuestion {
  id?: string;
  text: string;
  order: number;
  writingSectionId?: string;
  writingSubPartId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// File Upload Interface
export interface FileUpload {
  file: File;
}

// Create types (omitting id, createdAt, updatedAt)
export type CreateIELTS = Omit<IELTS, "id" | "createdAt" | "updatedAt">;
export type CreateTest = Omit<Test, "id" | "createdAt" | "updatedAt">;
export type CreateOnlyTest = Omit<OnlyTest, "id" | "createdAt" | "updatedAt">;
export type CreatePart = Omit<Part, "id" | "createdAt" | "updatedAt">;
export type CreateSection = Omit<Section, "id" | "createdAt" | "updatedAt">;
export type CreateQuestion = Omit<Question, "id" | "createdAt" | "updatedAt">;
export type CreateAnswer = Omit<Answer, "id" | "createdAt" | "updatedAt">;
export type CreateSpeakingTestType = Omit<
  SpeakingTest,
  "id" | "createdAt" | "updatedAt"
>;
export type CreateOnlySpeakingTestType = Omit<
  OnlySpeakingTest,
  "id" | "createdAt" | "updatedAt"
>;
export type CreateSpeakingSectionType = Omit<
  SpeakingSection,
  "id" | "createdAt" | "updatedAt"
>;
export type CreateSpeakingSubPartType = Omit<
  SpeakingSubPart,
  "id" | "createdAt" | "updatedAt"
>;

export type CreateSpeakingPoint = Omit<
  SpeakingPoint,
  "id" | "createdAt" | "updatedAt"
>;
export type CreateWritingTest = Omit<
  WritingTest,
  "id" | "createdAt" | "updatedAt"
>;
export type CreateWritingSection = Omit<
  WritingSection,
  "id" | "createdAt" | "updatedAt"
>;
export type CreateWritingSubPart = Omit<
  WritingSubPart,
  "id" | "createdAt" | "updatedAt"
>;
export type CreateWritingQuestion = Omit<
  WritingQuestion,
  "id" | "createdAt" | "updatedAt"
>;
