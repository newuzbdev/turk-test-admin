export type LearnLevel = "STARTER" | "A1" | "A2" | "B1" | "B2" | "C1";
export type LearnPublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type SkillTagCategory =
  | "GRAMMAR"
  | "VOCABULARY"
  | "READING"
  | "LISTENING"
  | "WRITING"
  | "SPEAKING"
  | "EXAM_STRATEGY"
  | "FUNCTIONAL_TURKISH";

export interface LearnCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: LearnLevel;
  status: LearnPublishStatus;
  thumbnailUrl: string | null;
  sortOrder: number;
  isFeatured: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    modules: number;
  };
}

export interface LearnCourseListResponse {
  total: number;
  page: number;
  limit: number;
  data: LearnCourse[];
}

export interface LearnCourseQuery {
  search?: string;
  level?: LearnLevel;
  status?: LearnPublishStatus;
}

export interface LearnCourseFormValues {
  slug: string;
  title: string;
  description?: string;
  level: LearnLevel;
  thumbnailUrl?: string;
  sortOrder?: number;
  isFeatured?: boolean;
}

export interface ReorderLearnCourseItem {
  id: string;
  sortOrder: number;
}

export interface LearnLesson {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  summary: string | null;
  status: LearnPublishStatus;
  estimatedMinutes: number | null;
  isPreview: boolean;
  sortOrder: number;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    contentBlocks: number;
    exercises: number;
  };
}

export interface LearnCourseModule {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string | null;
  status: LearnPublishStatus;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    lessons: number;
  };
  lessons: LearnLesson[];
}

export interface LearnCourseStructure {
  id: string;
  slug: string;
  title: string;
  level: LearnLevel;
  status: LearnPublishStatus;
  modules: LearnCourseModule[];
}

export interface LearnModuleFormValues {
  slug: string;
  title: string;
  description?: string;
}

export interface LearnLessonFormValues {
  slug: string;
  title: string;
  summary?: string;
  estimatedMinutes?: number;
  isPreview?: boolean;
}

export interface ReorderLearnStructureItem {
  id: string;
  sortOrder: number;
}

export type LearnContentBlockType =
  | "HEADING"
  | "TEXT"
  | "EXAMPLE"
  | "CALLOUT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "GRAMMAR_PATTERN"
  | "COMMON_MISTAKE"
  | "EXAM_TIP"
  | "VOCABULARY_LIST"
  | "MINI_QUESTION"
  | "FINAL_EXERCISE";

export interface LearnGrammarPatternRow {
  label?: string;
  form?: string;
  example?: string;
  note?: string;
}

export interface LearnGrammarPatternExample {
  text?: string;
  explanation?: string;
}

export interface LearnVocabularyItem {
  word?: string;
  meaning?: string;
  example?: string;
  note?: string;
}

export interface LearnGrammarPatternFormValues {
  pattern?: string;
  explanation?: string;
  rows?: LearnGrammarPatternRow[];
  examples?: LearnGrammarPatternExample[];
}

export interface LearnCommonMistakeFormValues {
  wrong?: string;
  correct?: string;
  explanation?: string;
}

export interface LearnExamTipFormValues {
  tip?: string;
  skillTagKey?: string;
  level?: LearnLevel;
}

export interface LearnVocabularyListFormValues {
  items?: LearnVocabularyItem[];
}

export type LearnContentBlockData = {
  exerciseId?: string;
  pattern?: string;
  explanation?: string;
  rows?: LearnGrammarPatternRow[];
  examples?: LearnGrammarPatternExample[];
  wrong?: string;
  correct?: string;
  tip?: string;
  skillTagKey?: string;
  level?: LearnLevel;
  items?: LearnVocabularyItem[];
};

export interface LearnContentBlock {
  id: string;
  lessonId: string;
  type: LearnContentBlockType;
  sortOrder: number;
  title: string | null;
  text: string | null;
  mediaUrl: string | null;
  data: LearnContentBlockData | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearnContentBlockFormValues {
  type: LearnContentBlockType;
  title?: string;
  text?: string;
  mediaUrl?: string;
  exerciseId?: string;
  grammarPattern?: LearnGrammarPatternFormValues;
  commonMistake?: LearnCommonMistakeFormValues;
  examTip?: LearnExamTipFormValues;
  vocabularyList?: LearnVocabularyListFormValues;
}

export interface LearnContentBlockPayload {
  type: LearnContentBlockType;
  title?: string;
  text?: string;
  mediaUrl?: string;
  data?: LearnContentBlockData;
}

export type LearnExerciseType = "PRACTICE" | "QUIZ" | "FINAL";

export type LearnQuestionType =
  | "MULTIPLE_CHOICE"
  | "MULTI_SELECT"
  | "TRUE_FALSE"
  | "TEXT_INPUT"
  | "FILL_BLANK";

export interface LearnExercise {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  type: LearnExerciseType;
  status: LearnPublishStatus;
  sortOrder: number;
  isRequired: boolean;
  passingScore: number | null;
  maxAttempts: number | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    questions: number;
    attempts: number;
  };
}

export interface LearnExerciseFormValues {
  title: string;
  instructions?: string;
  type: LearnExerciseType;
  isRequired?: boolean;
  passingScore?: number;
  maxAttempts?: number;
}

export interface LearnExerciseQuestion {
  id: string;
  exerciseId: string;
  type: LearnQuestionType;
  prompt: string;
  explanation: string | null;
  options: string[] | null;
  answerKey:
    | { optionIndex: number }
    | { optionIndexes: number[] }
    | { value: boolean }
    | { acceptedAnswers: string[] };
  sortOrder: number;
  points: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    answers: number;
  };
}

export interface LearnQuestionFormValues {
  type: LearnQuestionType;
  prompt: string;
  explanation?: string;
  optionsText?: string;
  correctOption?: number;
  correctOptionsText?: string;
  trueFalseValue?: "true" | "false";
  acceptedAnswersText?: string;
  points?: number;
}

export interface LearnQuestionPayload {
  type: LearnQuestionType;
  prompt: string;
  explanation?: string;
  options: string[] | null;
  answerKey:
    | { optionIndex: number }
    | { optionIndexes: number[] }
    | { value: boolean }
    | { acceptedAnswers: string[] };
  points?: number;
}

export interface LearnSkillTagSummary {
  id: string;
  key: string;
  title: string;
  description: string | null;
  category: SkillTagCategory;
  level: LearnLevel | null;
  parentId: string | null;
  isActive: boolean;
}

export interface LearnSkillTag extends LearnSkillTagSummary {
  createdAt: string;
  updatedAt: string;
  parent: LearnSkillTagSummary | null;
  _count: {
    children: number;
    lessonLinks: number;
    questionLinks: number;
  };
}

export interface LearnSkillTagListResponse {
  total: number;
  page: number;
  limit: number;
  data: LearnSkillTag[];
}

export interface LearnSkillTagQuery {
  search?: string;
  category?: SkillTagCategory;
  level?: LearnLevel;
  isActive?: boolean;
  parentId?: string;
}

export interface LearnSkillTagFormValues {
  key: string;
  title: string;
  description?: string | null;
  category: SkillTagCategory;
  level?: LearnLevel | null;
  parentId?: string | null;
}

export interface LearnSkillTagLink {
  id: string;
  lessonId?: string;
  questionId?: string;
  skillTagId: string;
  weight: number;
  createdAt: string;
  skillTag: LearnSkillTagSummary;
}

export interface ReplaceLearnSkillTagLinksPayload {
  items: Array<{
    skillTagId: string;
    weight?: number;
  }>;
}
