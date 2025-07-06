export const readingEndpoints = {
  all: "/reading",
  one: (id: string) => `/reading/${id}`,
};
export const writingEndpoints = {
  all: "/api/writing-test",
  one: (id: string) => `/api/writing-test/${id}`,
};

export const authEndpoints = {
  login: "/api/admin/login",
  refresh: "/api/admin/refresh",
  logout: "/api/admin/logout",
};

export const speakingEndpoint = "/api/speaking-test";
export const ieltsEndpoint = "/api/ielts";
export const testEndpoint = "/api/test";
