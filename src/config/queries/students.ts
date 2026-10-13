import {
  usePrivateAccessQuery,
  useAccessConfig,
  type AccessRecord,
  type AccessScope,
} from "./access";
import { studentsEndpoints } from "@/config/endpoint";
export type StudentIdentity = {
  id: string;
  name: string | null;
  email: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  signupMethod?: "GOOGLE" | "TELEGRAM" | "LOCAL" | "UNKNOWN";
  registrationOrigin?: {
    countryCode: string | null;
    city: string | null;
    source:
      "INSTAGRAM" | "TELEGRAM" | "GOOGLE" | "YOUTUBE" | "OTHER" | "UNKNOWN";
    medium: string | null;
    campaign: string | null;
    capturedAt: string;
  } | null;
  createdAt?: string;
  membership?: "ACTIVE" | "EXPIRED" | "NONE" | "SCHEDULED";
};
export type StudentFilters = { q: string; page: number; limit: number };
export type StudentDirectoryFilters = StudentFilters & {
  joinedPeriod?: "ALL" | "TODAY" | "WEEK" | "MONTH";
  membership?: "ALL" | "ACTIVE" | "EXPIRED" | "NONE";
  order?: "NEWEST" | "OLDEST";
};
export type PublishedAccessTarget = {
  id: string;
  title: string;
  scope: AccessScope;
  buckets: string[];
};
export const studentQueryKey = (
  filters: StudentDirectoryFilters,
  adminId: string,
) => ["admin", "students", filters, adminId] as const;
export function useStudents(filters: StudentDirectoryFilters) {
  const config = useAccessConfig();
  return usePrivateAccessQuery<{
    items: StudentIdentity[];
    total: number;
    page: number;
    limit: number;
  }>(
    (adminId) => studentQueryKey(filters, adminId),
    studentsEndpoints.all,
    filters,
    config.data?.enabled === true,
  );
}
export function useStudent(id: string) {
  const config = useAccessConfig();
  return usePrivateAccessQuery<StudentIdentity>(
    ["admin", "student", id],
    studentsEndpoints.one(id),
    undefined,
    config.data?.enabled === true && !!id,
  );
}
export function useStudentAccess(id: string) {
  const config = useAccessConfig();
  return usePrivateAccessQuery<AccessRecord[]>(
    ["admin", "access", id],
    studentsEndpoints.access(id),
    undefined,
    config.data?.enabled === true && !!id,
  );
}
export function usePublishedAccessTargets(
  scope: AccessScope,
  q: string,
  page = 1,
  targetId?: string,
) {
  const config = useAccessConfig();
  return usePrivateAccessQuery<{
    items: PublishedAccessTarget[];
    total: number;
  }>(
    ["admin", "access-targets", { scope, q, page, targetId }],
    studentsEndpoints.targets,
    { scope, q, page, targetId, limit: 25 },
    config.data?.enabled === true && scope !== "PLATFORM",
  );
}

// Safe projections returned by the ADMIN activity endpoints. No answer/audio/token fields.
export const studentPages = [
  "DASHBOARD",
  "MOCK_CATALOG",
  "PRACTICE_CATALOG",
  "PREPARATION",
  "MOCK_TEST",
  "PRACTICE_TEST",
  "RESULT",
  "PROFILE",
  "SUBSCRIPTION",
  "OTHER",
] as const;
export type StudentPage = (typeof studentPages)[number];
export type ActivityState = "PAGE" | "PREPARING" | "SOLVING" | "EVALUATING";
export type StudentLiveFilters = StudentFilters & {
  studentPage?: StudentPage;
  state?: ActivityState;
};
export type StudentCounts = {
  mockStarted: number;
  mockCompleted: number;
  practiceCompleted: {
    reading: number;
    listening: null;
    writing: number;
    speaking: number;
  };
};
export type VerifiedActivity = {
  state: ActivityState;
  targetId: string | null;
  attemptId: string | null;
  title: string | null;
  section: string | null;
  startedAt: string | null;
  expiresAt: string | null;
};
export type StudentActivePage = {
  device?: StudentDevice | null;
  page: StudentPage;
  visible: boolean;
  lastSeenAt: string;
  activity: VerifiedActivity;
};
export type StudentDevice = {
  kind: "COMPUTER" | "PHONE" | "TABLET" | "UNKNOWN";
  os:
    "WINDOWS" | "MACOS" | "IOS" | "ANDROID" | "LINUX" | "CHROME_OS" | "UNKNOWN";
  browser:
    "CHROME" | "SAFARI" | "EDGE" | "FIREFOX" | "OPERA" | "SAMSUNG" | "UNKNOWN";
  observedAt: string;
};
export type StudentLiveRow = StudentIdentity &
  StudentActivePage & { counts: StudentCounts };
export type StudentLiveResponse = {
  items: StudentLiveRow[];
  total: number;
  page: number;
  limit: number;
  registeredCount: number;
  onlineCount: number;
  solvingCount: number;
  observedAt: string;
  onlineWindowSeconds: 90;
};
export type StudentHistoryRow = {
  id: string;
  kind: "MOCK" | "PRACTICE_READING" | "PRACTICE_WRITING" | "PRACTICE_SPEAKING";
  targetId: string | null;
  title: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  writingEvaluationStatus: string | null;
  speakingEvaluationStatus: string | null;
};
export type StudentActivityResponse = {
  lastDevice?: StudentDevice | null;
  student: StudentIdentity;
  counts: StudentCounts;
  observedAt: string;
  onlineWindowSeconds: 90;
  activePages: StudentActivePage[];
  history: {
    items: StudentHistoryRow[];
    total: number;
    page: number;
    limit: number;
  };
};
