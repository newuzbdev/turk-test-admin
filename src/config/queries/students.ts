import { useQuery } from "@tanstack/react-query";
import {
  accessGet,
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
};
export type StudentFilters = { q: string; page: number; limit: number };
export type PublishedAccessTarget = {
  id: string;
  title: string;
  scope: AccessScope;
  buckets: string[];
};
export const studentQueryKey = (filters: StudentFilters) =>
  ["admin", "students", filters] as const;
export function useStudents(filters: StudentFilters) {
  const config = useAccessConfig();
  return useQuery({
    queryKey: studentQueryKey(filters),
    queryFn: () =>
      accessGet<{
        items: StudentIdentity[];
        total: number;
        page: number;
        limit: number;
      }>(studentsEndpoints.all, filters),
    enabled: config.data?.enabled === true,
    meta: { persist: false },
  });
}
export function useStudent(id: string) {
  const config = useAccessConfig();
  return useQuery({
    queryKey: ["admin", "student", id],
    queryFn: () => accessGet<StudentIdentity>(studentsEndpoints.one(id)),
    enabled: config.data?.enabled === true && !!id,
    meta: { persist: false },
  });
}
export function useStudentAccess(id: string) {
  const config = useAccessConfig();
  return useQuery({
    queryKey: ["admin", "access", id],
    queryFn: () => accessGet<AccessRecord[]>(studentsEndpoints.access(id)),
    enabled: config.data?.enabled === true && !!id,
    meta: { persist: false },
  });
}
export function usePublishedAccessTargets(
  scope: AccessScope,
  q: string,
  page = 1,
  targetId?: string,
) {
  const config = useAccessConfig();
  return useQuery({
    queryKey: ["admin", "access-targets", { scope, q, page, targetId }],
    queryFn: () =>
      accessGet<{ items: PublishedAccessTarget[]; total: number }>(
        studentsEndpoints.targets,
        { scope, q, page, targetId, limit: 25 },
      ),
    enabled: config.data?.enabled === true && scope !== "PLATFORM",
    meta: { persist: false },
  });
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
  page: StudentPage;
  visible: boolean;
  lastSeenAt: string;
  activity: VerifiedActivity;
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
