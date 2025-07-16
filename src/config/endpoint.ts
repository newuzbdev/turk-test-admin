// Auth endpoints
export const authEndpoints = {
  login: "/api/admin/login",
  refresh: "/api/admin/refresh",
  logout: "/api/admin/logout",
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
};

// Writing Test endpoints
export const writingTestEndpoints = {
  all: "/api/writing-test",
  one: (id: string) => `/api/writing-test/${id}`,
};

// Writing Section endpoints
export const writingSectionEndpoints = {
  all: "/api/writing-section",
  one: (id: string) => `/api/writing-section/${id}`,
};

// Writing SubPart endpoints
export const writingSubPartEndpoints = {
  all: "/api/writing-sub-part",
  one: (id: string) => `/api/writing-sub-part/${id}`,
};
