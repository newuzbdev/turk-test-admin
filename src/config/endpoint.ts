// Auth endpoints
export const authEndpoints = {
  login: "/api/admin/login",
  refresh: "/api/admin/refresh",
  logout: "/api/admin/logout",
  update: (id: string) => `/api/admin/${id}`,
};

// IELTS endpoints
export const ieltsEndpoints = {
  all: "/api/ielts",
  one: (id: string) => `/api/ielts/${id}`,
};

// Reading Or Listening Test endpoints
export const testEndpoints = {
  all: "/api/test",
  one: (id: string) => `/api/test/${id}`,
  only: "/api/test/only",
  onlyOne: (id: string) => `/api/test/only/${id}`,
  testAddition: (id: string) => `/api/test/testaddition/${id}`,
  updateTestFullTree: (id: string) => `/api/test/full/${id}`,
  reviseTestFullTree: (id: string) => `/api/test/full/${id}/revision`,
  publicationReadiness: (id: string) => `/api/test/full/${id}/readiness`,
  alignListeningTranscript: (id: string) =>
    `/api/test/full/${id}/align-listening-transcript`,
  publish: (id: string) => `/api/test/full/${id}/publish`,
  moveToDraft: (id: string) => `/api/test/full/${id}/draft`,
  archive: "/api/archive",
};

// Listening Test endpoints (using same API but with type filtering)
export const listeningEndpoints = {
  all: "/api/test",
  one: (id: string) => `/api/test/${id}`,
  only: "/api/test/only",
  onlyOne: (id: string) => `/api/test/only/${id}`,
};

// Reading Test endpoints (using same API but with type filtering)
export const readingEndpoints = {
  all: "/api/test",
  one: (id: string) => `/api/test/${id}`,
  only: "/api/test/only",
  onlyOne: (id: string) => `/api/test/only/${id}`,
};

// Reading Or Listening Parts endpoints
export const partsEndpoints = {
  all: "/api/parts",
  one: (id: string) => `/api/parts/${id}`,
};

// Reading Or Listening Section endpoints
export const sectionEndpoints = {
  all: "/api/section",
  one: (id: string) => `/api/section/${id}`,
};

// Reading Or Listening Question endpoints
export const questionEndpoints = {
  all: "/api/question",
  one: (id: string) => `/api/question/${id}`,
};

// Reading Or Listening Answer endpoints
export const answerEndpoints = {
  all: "/api/answer",
  one: (id: string) => `/api/answer/${id}`,
};

// Reading Or Listening Exam endpoints
export const examEndpoints = {
  submitAll: "/api/exam/submit-all",
  all: "/api/exam",
  userAnswers: "/api/exam/user-answers",
  result: "/api/exam/result",
};

// Speaking Test endpoints
export const speakingTestEndpoints = {
  all: "/api/speaking-test",
  one: (id: string) => `/api/speaking-test/${id}`,
  only: "/api/speaking-test/only",
  onlyOne: (id: string) => `/api/speaking-test/only/${id}`,
  full: (id: string) => `/api/speaking-test/full/${id}`,
  v2: "/api/speaking-test/v2",
  v2One: (id: string) => `/api/speaking-test/v2/${id}`,
  updateV2: (id: string) => `/api/speaking-test/v2/${id}`,
  publishV2: (id: string) => `/api/speaking-test/v2/${id}/publish`,
  publicationCheckV2: (id: string) => `/api/speaking-test/v2/${id}/publication-check`,
  prepareAudioV2: (id: string) => `/api/speaking-test/v2/${id}/prepare-audio`,
  audioV2: (id: string, key: string) =>
    `/api/speaking-test/v2/${id}/audio/${key}`,
  deleteAudioV2: (id: string, key: string) =>
    `/api/speaking-test/v2/${id}/audio/${key}`,
  reviseV2: (id: string) => `/api/speaking-test/v2/${id}/revise`,
  archiveV2: (id: string) => `/api/speaking-test/v2/${id}/archive`,
  deleteV2: (id: string) => `/api/speaking-test/v2/${id}`,
};

// Speaking Section endpoints
export const speakingSectionEndpoints = {
  all: "/api/speaking-section",
  one: (id: string) => `/api/speaking-section/${id}`,
};

// Speaking SubPart endpoints
export const speakingSubPartEndpoints = {
  all: "/api/speaking-sub-part",
  one: (id: string) => `/api/speaking-sub-part/${id}`,
};

// Speaking Question endpoints
export const speakingQuestionEndpoints = {
  all: "/api/speaking-question",
  one: (id: string) => `/api/speaking-question/${id}`,
  subpartQuestions: "/api/speaking-question/subpart-questions",
};

// Speaking Point endpoints
export const speakingPointEndpoints = {
  all: "/api/speaking-point",
  one: (id: string) => `/api/speaking-point/${id}`,
};

// File endpoints
export const fileEndpoints = {
  upload: "/api/file/upload",
  accessUrl: "/api/file/access-url",
  downloadUrl: "/api/file/download-url",
};

// Writing Test endpoints
export const writingTestEndpoints = {
  all: "/api/writing-test",
  one: (id: string) => `/api/writing-test/${id}`,
  v2: "/api/writing-test/v2",
  updateV2: (id: string) => `/api/writing-test/v2/${id}`,
  reviseV2: (id: string) => `/api/writing-test/v2/${id}/revise`,
  publishV2: (id: string) => `/api/writing-test/v2/${id}/publish`,
  archiveV2: (id: string) => `/api/writing-test/v2/${id}/archive`,
  studentV2: (id: string) => `/api/writing-test/v2/${id}/student`,
  // Specific update endpoints
  updateTitle: (id: string) => `/api/writing-test/${id}/title`,
  updateInstruction: (id: string) => `/api/writing-test/${id}/instruction`,
  full: (id: string) => `/api/writing-test/full/${id}`,
};

// Writing Section endpoints
export const writingSectionEndpoints = {
  all: "/api/writing-section",
  one: (id: string) => `/api/writing-section/${id}`,
  // Specific update endpoints
  updateTitle: (id: string) => `/api/writing-section/${id}/title`,
  updateDescription: (id: string) => `/api/writing-section/${id}/description`,
  updateContent: (id: string) => `/api/writing-section/${id}/content`,
  updateOrder: (id: string) => `/api/writing-section/${id}/order`,
};

// Writing SubPart endpoints
export const writingSubPartEndpoints = {
  all: "/api/writing-sub-part",
  one: (id: string) => `/api/writing-sub-part/${id}`,
  // Specific update endpoints
  updateTitle: (id: string) => `/api/writing-sub-part/${id}/title`,
  updateDescription: (id: string) => `/api/writing-sub-part/${id}/description`,
  updateContent: (id: string) => `/api/writing-sub-part/${id}/content`,
  updateOrder: (id: string) => `/api/writing-sub-part/${id}/order`,
};

// Writing Question endpoints
export const writingQuestionEndpoints = {
  all: "/api/writing-question",
  one: (id: string) => `/api/writing-question/${id}`,
  // Specific update endpoints
  updateText: (id: string) => `/api/writing-question/${id}/text`,
  updateOrder: (id: string) => `/api/writing-question/${id}/order`,
};

// Banner endpoints
export const bannerEndpoints = {
  all: "/api/banner",
  one: (id: string) => `/api/banner/${id}`,
};

// Product endpoints
export const productEndpoints = {
  all: "/api/product",
  one: (id: string) => `/api/product/${id}`,
};

// Test Coin Price endpoints
export const testCoinPriceEndpoints = {
  all: "/api/test-coin-price",
  one: (id: string) => `/api/test-coin-price/${id}`,
};

// User coin management endpoints
export const userCoinEndpoints = {
  search: "/api/admin/users/search",
  addCoins: "/api/admin/users/add-coins",
};

export const subscriptionEndpoints = {
  config: "/api/subscription/config",
  admin: "/api/subscription/admin",
};

export const aiCostEndpoints = {
  summary: "/api/admin/ai-costs/summary",
};

// Reading Practice management endpoints
export const readingPracticeEndpoints = {
  all: "/api/reading-practice",
  one: (id: string) => `/api/reading-practice/${id}`,
  adminAll: "/api/reading-practice/admin/all",
  adminOne: (id: string) => `/api/reading-practice/admin/${id}`,
  generateGuides: "/api/reading-practice/admin/generate-guides",
  generateGlossary: "/api/reading-practice/admin/generate-glossary",
};

export const listeningPracticeEndpoints = {
  all: "/api/listening-practice",
  adminAll: "/api/listening-practice/admin/all",
  adminOne: (id: string) => `/api/listening-practice/admin/${id}`,
  one: (id: string) => `/api/listening-practice/${id}`,
  content: (id: string) => `/api/listening-practice/${id}/content`,
};

export const writingPracticeEndpoints = {
  all: "/api/writing-practice",
  adminAll: "/api/writing-practice/admin/all",
  adminOne: (id: string) => `/api/writing-practice/admin/${id}`,
  one: (id: string) => `/api/writing-practice/${id}`,
  content: (id: string) => `/api/writing-practice/${id}/content`,
};

export const speakingPracticeEndpoints = {
  all: "/api/speaking-practice",
  adminAll: "/api/speaking-practice/admin/all",
  adminOne: (id: string) => `/api/speaking-practice/admin/${id}`,
  one: (id: string) => `/api/speaking-practice/${id}`,
  content: (id: string) => `/api/speaking-practice/${id}/content`,
};

// Learn course management endpoints
export const learnCourseEndpoints = {
  all: "/api/admin/learn/courses",
  one: (id: string) => `/api/admin/learn/courses/${id}`,
  status: (id: string) => `/api/admin/learn/courses/${id}/status`,
  reorder: "/api/admin/learn/courses/reorder",
};

export const learnStructureEndpoints = {
  course: (courseId: string) =>
    `/api/admin/learn/courses/${courseId}/structure`,
  createModule: (courseId: string) =>
    `/api/admin/learn/courses/${courseId}/modules`,
  module: (id: string) => `/api/admin/learn/modules/${id}`,
  moduleStatus: (id: string) => `/api/admin/learn/modules/${id}/status`,
  reorderModules: (courseId: string) =>
    `/api/admin/learn/courses/${courseId}/modules/reorder`,
  createLesson: (moduleId: string) =>
    `/api/admin/learn/modules/${moduleId}/lessons`,
  lesson: (id: string) => `/api/admin/learn/lessons/${id}`,
  lessonStatus: (id: string) => `/api/admin/learn/lessons/${id}/status`,
  reorderLessons: (moduleId: string) =>
    `/api/admin/learn/modules/${moduleId}/lessons/reorder`,
  blocks: (lessonId: string) =>
    `/api/admin/learn/lessons/${lessonId}/blocks`,
  block: (id: string) => `/api/admin/learn/blocks/${id}`,
  reorderBlocks: (lessonId: string) =>
    `/api/admin/learn/lessons/${lessonId}/blocks/reorder`,
  exercises: (lessonId: string) =>
    `/api/admin/learn/lessons/${lessonId}/exercises`,
  exercise: (id: string) => `/api/admin/learn/exercises/${id}`,
  exerciseStatus: (id: string) =>
    `/api/admin/learn/exercises/${id}/status`,
  reorderExercises: (lessonId: string) =>
    `/api/admin/learn/lessons/${lessonId}/exercises/reorder`,
  questions: (exerciseId: string) =>
    `/api/admin/learn/exercises/${exerciseId}/questions`,
  question: (id: string) => `/api/admin/learn/questions/${id}`,
  reorderQuestions: (exerciseId: string) =>
    `/api/admin/learn/exercises/${exerciseId}/questions/reorder`,
};

export const learnSkillTagEndpoints = {
  all: "/api/admin/learn/skill-tags",
  one: (id: string) => `/api/admin/learn/skill-tags/${id}`,
  status: (id: string) => `/api/admin/learn/skill-tags/${id}/status`,
  lessonTags: (lessonId: string) =>
    `/api/admin/learn/lessons/${lessonId}/skill-tags`,
  questionTags: (questionId: string) =>
    `/api/admin/learn/questions/${questionId}/skill-tags`,
};

export const accessEndpoints={config:"/api/access/config",grants:"/api/admin/access/grants",publicPolicies:"/api/admin/access/public-policies",shares:"/api/admin/access/share-links"};
export const studentsEndpoints={live:"/api/admin/students/live",activity:(id:string)=>`/api/admin/students/${encodeURIComponent(id)}/activity`,all:"/api/admin/students",one:(id:string)=>`/api/admin/students/${id}`,access:(id:string)=>`/api/admin/students/${id}/access`,targets:"/api/admin/students/access-targets"};

export const billingPackageEndpoints={packages:'/api/admin/billing/packages',settings:'/api/admin/billing/settings',content:'/api/admin/billing/content-options',
 one:(id:string)=>`/api/admin/billing/packages/${id}`,history:(id:string)=>`/api/admin/billing/packages/${id}/history`,
 publish:(id:string)=>`/api/admin/billing/packages/${id}/publish`,sales:(id:string)=>`/api/admin/billing/packages/${id}/sales`,sort:(id:string)=>`/api/admin/billing/packages/${id}/sort`};
