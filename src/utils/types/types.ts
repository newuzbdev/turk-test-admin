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
  total?: number;
  writingTest: boolean;
  speakingTest: boolean;
  readingTest: boolean;
  listeningTest: boolean;
  ielts: boolean;
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
// IELTS Interface
export type MockPackageCategory = "CEFR_MOCK" | "LISTENING" | "READING" | "WRITING" | "SPEAKING";

export interface IELTS {
  id?: string;
  title: string;
  category?: MockPackageCategory;
  createdAt?: string;
  updatedAt?: string;
}

// Banner Interface
export interface Banner {
  id?: string;
  _id?: string;
  name: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBanner {
  name: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateBanner {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  order?: number;
}

// Product Interface
export interface Product {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProduct {
  name: string;
  price: number;
}

export interface UpdateProduct {
  id: string;
  name?: string;
  price?: number;
}

// TestCoinPrice Interface
export interface TestCoinPrice {
  id?: string;
  testType: string;
  coin: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateTestCoinPrice {
  id: string;
  testType?: string;
  coin?: number;
}

export interface UserCoinUser {
  id?: string;
  username?: string;
  telegramId?: string | number;
  phoneNumber?: string;
  phone?: string;
  coin?: number;
  coins?: number;
  balance?: number;
  walletBalance?: number;
  [key: string]: unknown;
}

export interface SearchUserResponse {
  success?: boolean;
  data?: UserCoinUser;
  user?: UserCoinUser;
  id?: string;
  username?: string;
  telegramId?: string | number;
  phoneNumber?: string;
  phone?: string;
  coin?: number;
  coins?: number;
  balance?: number;
  walletBalance?: number;
}

export interface AddCoinsPayload {
  identifier: string;
  amount: number;
}

// Test Interfaces
export interface Test {
  isDeleted?: boolean;
  id?: string;
  title: string;
  type: string;
  ieltsId: string;
  ielts?: { title?: string | null } | null;
  status?: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  contentRevision?: number;
  publicationReadiness?: MockPublicationReadiness;
  createdAt?: string;
  updatedAt?: string;
  parts?: Part[];
}

export interface OnlyTest {
  id?: string;
  title: string;
  type: string;
  status?: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  contentRevision?: number;
  publicationReadiness?: MockPublicationReadiness;
  createdAt?: string;
  updatedAt?: string;
}

export type MockPublicationIssueCode =
  | "TEST_QUESTIONS_REQUIRED"
  | "CORRECT_ANSWER_REQUIRED"
  | "PASSAGE_REQUIRED"
  | "TRANSCRIPT_REQUIRED"
  | "EVIDENCE_REQUIRED"
  | "EXPLANATION_REQUIRED"
  | "SOURCE_RANGE_INVALID"
  | "AUDIO_REQUIRED"
  | "AUDIO_DURATION_REQUIRED"
  | "AUDIO_RANGE_INVALID"
  | "OFFICIAL_READING_PART_STRUCTURE"
  | "OFFICIAL_READING_QUESTION_COUNT"
  | "OFFICIAL_READING_QUESTION_NUMBER"
  | "OFFICIAL_READING_QUESTION_TYPE"
  | "OFFICIAL_READING_OPTION_STRUCTURE"
  | "OFFICIAL_READING_SOURCE_STRUCTURE"
  | "OFFICIAL_LISTENING_PART_STRUCTURE"
  | "OFFICIAL_LISTENING_QUESTION_COUNT"
  | "OFFICIAL_LISTENING_QUESTION_NUMBER"
  | "OFFICIAL_LISTENING_QUESTION_TYPE"
  | "OFFICIAL_LISTENING_OPTION_STRUCTURE"
  | "OFFICIAL_LISTENING_SOURCE_STRUCTURE";

export interface MockPublicationIssue {
  code: MockPublicationIssueCode;
  questionNumber: number | null;
}

export interface MockPublicationReadiness {
  ready: boolean;
  questionCount: number;
  issues: MockPublicationIssue[];
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
  visualContext?: SpeakingVisualContext;
  createdAt?: string;
  updatedAt?: string;
  questions?: SpeakingQuestion[];
}

export interface SpeakingVisualContext {
  verified: boolean;
  imageDescriptions: string[];
  comparisonPoints: string[];
  forbiddenAssumptions: string[];
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

export interface SpeakingExample {
  text: string;
  order: number;
}

export interface SpeakingPoint {
  id?: string;
  order: number;
  type: "ADVANTAGE" | "DISADVANTAGE";
  speakingSectionId: string;
  createdAt?: string;
  updatedAt?: string;
  examples?: SpeakingExample[];
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
  visualContext?: SpeakingVisualContext;
  questions: CreateSpeakingQuestion[];
}

export interface CreateSpeakingQuestion {
  order: number;
  question: string;
}

export interface CreateSpeakingPointDTO {
  order: number;
  type: "ADVANTAGE" | "DISADVANTAGE";
  examples?: SpeakingExample[];
}

// Writing Test Interfaces
export interface WritingTest {
  id?: string;
  title: string | null;
  instruction?: string;
  type?: string;
  isDeleted?: boolean;
  ieltsId: string;
  createdAt?: string;
  updatedAt?: string;
  formatVersion?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  durationMinutes?: number;
  sourceEmail?: Record<string, unknown> | null;
  ielts?: {
    id: string;
    title: string;
  };
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
  partCode?: "PART_1" | "PART_2" | null;
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
  label?: string;
  taskCode?: "TASK_1_1" | "TASK_1_2" | "TASK_2" | null;
  promptJson?: Record<string, unknown> | null;
  register?: string | null;
  genre?: string | null;
  targetLevel?: string | null;
  wordMin?: number | null;
  wordMax?: number | null;
  maxRawScore?: number | null;
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

export interface ReadingPracticeParagraph {
  label: string;
  title?: string;
  text: string;
  imageUrl?: string;
  imagePositionX?: number;
  imagePositionY?: number;
}

export interface ReadingPracticeGlossaryEntry {
  id?: string;
  order: number;
  term: string;
  definition: string;
  simpleDefinition?: string;
  baseForm?: string;
  baseMeaning?: string;
  contextMeaning?: string;
  contextSnippet?: string;
  occurrenceIndex?: number;
  translation?: string;
  example?: string;
  paragraphLabel?: string;
}

export interface ReadingPracticeQuestion {
  id?: string;
  order: number;
  prompt: string;
  answerKey: unknown;
  options?: unknown;
  acceptedAnswers?: unknown;
  explanation?: string;
  evidenceParagraphs?: unknown;
  meta?: unknown;
}

export interface ReadingPracticeGuideGenerationItem {
  key: string;
  guideSnippet: string;
  keywords: string[];
}

export interface ReadingPracticeGuideGenerationResponse {
  items: ReadingPracticeGuideGenerationItem[];
  model?: string;
}

export interface ReadingPracticeGlossaryGenerationRequest {
  title?: string;
  level?: string;
  paragraphs: ReadingPracticeParagraph[];
  existingEntries?: ReadingPracticeGlossaryEntry[];
  additionalTerms?: Array<{ term: string; paragraphLabel?: string }>;
}

export interface ReadingPracticeGlossaryGenerationResponse {
  entries: ReadingPracticeGlossaryEntry[];
  model?: string;
  requestedCount?: number;
  generatedCount?: number;
  missingCount?: number;
}

export interface ReadingPracticeQuestionGroup {
  id?: string;
  order: number;
  title: string;
  type: string;
  instructions?: string;
  questions: ReadingPracticeQuestion[];
}

export interface ReadingPracticePassage {
  id?: string;
  title: string;
  passageTitle?: string;
  description?: string;
  coverImageUrl?: string;
  topic?: string;
  level?: string;
  price?: number;
  coinCost?: number;
  estimatedMinutes: number;
  practiceType: "COMPREHENSIVE" | "SECTION";
  sectionNumber?: number;
  isPublished: boolean;
  isFreeAccess?: boolean;
  paragraphs: ReadingPracticeParagraph[];
  glossaryEntries: ReadingPracticeGlossaryEntry[];
  questionGroups: ReadingPracticeQuestionGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadingPracticeListItem {
  id: string;
  title: string;
  passageTitle?: string;
  description?: string;
  topic?: string;
  level?: string;
  price?: number;
  coinCost?: number;
  estimatedMinutes: number;
  practiceType: "COMPREHENSIVE" | "SECTION";
  sectionNumber?: number;
  isPublished: boolean;
  isFreeAccess?: boolean;
  paragraphs: ReadingPracticeParagraph[];
  glossaryCount: number;
  questionGroupCount: number;
  questionCount: number;
  attemptCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadingPracticeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  isPublished?: boolean;
  practiceType?: "COMPREHENSIVE" | "SECTION";
  sectionNumber?: number;
}

export interface ReadingPracticeListResponse {
  total: number;
  page: number;
  limit: number;
  data: ReadingPracticeListItem[];
}

export type CreateReadingPractice = Omit<
  ReadingPracticePassage,
  "id" | "createdAt" | "updatedAt"
>;

export interface UpdateReadingPractice extends Partial<CreateReadingPractice> {
  id: string;
}
