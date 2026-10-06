import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { accessEndpoints } from "@/config/endpoint";
export const accessScopes = [
  "PLATFORM",
  "MOCK_PACKAGE",
  "MOCK_READING",
  "MOCK_LISTENING",
  "MOCK_WRITING",
  "MOCK_SPEAKING",
  "PRACTICE_READING",
  "PRACTICE_LISTENING",
  "PRACTICE_WRITING",
  "PRACTICE_SPEAKING",
] as const;
export type AccessScope = (typeof accessScopes)[number];
export type AccessTarget = { scope: AccessScope; targetId?: string };
export type LimitField =
  "writingMockLimit" | "speakingMockLimit" | "practiceAiLimit";
export type AccessRecord = AccessTarget & {
  id: string;
  revision: number;
  startsAt: string;
  endsAt: string;
  revokedAt: string | null;
  reason?: string;
  writingMockLimit: number;
  speakingMockLimit: number;
  practiceAiLimit: number;
  state?: string;
  remaining?: Record<string, number>;
  redemptionCount?: number;
  usage?: Record<string, number>;
  audit?: {
    actorId: string;
    occurredAt: string;
    action: string;
    reason?: string;
  }[];
};
export type AccessPayload = AccessTarget & {
  startsAt: string;
  endsAt: string;
  reason?: string;
  requestId: string;
  userId?: string;
  expectedRevision?: number;
} & Partial<Record<LimitField, number>>;
export async function accessGet<T>(url: string, params?: object): Promise<T> {
  const response = await axiosPrivate.get(url, { params });
  if (response.data?.success === false)
    throw { response: { data: response.data } };
  return response.data.data;
}
export async function accessWrite<T = AccessRecord>(
  url: string,
  body: object = {},
  method: "post" | "patch" = "post",
): Promise<T> {
  const response = await axiosPrivate[method](url, body);
  if (response.data?.success === false)
    throw { response: { data: response.data } };
  return response.data.data;
}
export function useAccessConfig() {
  return useQuery({
    queryKey: ["admin", "access-config"],
    queryFn: () => accessGet<{ enabled: boolean }>(accessEndpoints.config),
    staleTime: Infinity,
    retry: false,
    meta: { persist: false },
  });
}
export function useTargetAccess(
  kind: "public-access" | "share-links",
  target: AccessTarget,
  active = true,
  page = 1,
) {
  const config = useAccessConfig();
  return useQuery({
    queryKey:
      kind === "share-links"
        ? ["admin", kind, target, page]
        : ["admin", kind, target],
    queryFn: () =>
      accessGet<AccessRecord[]>(
        kind === "public-access"
          ? accessEndpoints.publicPolicies
          : accessEndpoints.shares,
        { ...target, page, limit: 25 },
      ),
    enabled: config.data?.enabled === true && active && !!target.targetId,
    meta: { persist: false },
  });
}
export function useRefreshAccess() {
  const client = useQueryClient();
  return async () => {
    await client.invalidateQueries({}, { throwOnError: true });
  };
}
export function accessError(error: unknown): string {
  const e = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return String(
    e?.response?.data?.message ??
      e?.response?.data?.error ??
      e?.message ??
      "Erişim kaydedilemedi.",
  );
}

const ACCESS_CONFLICT_CODES = new Set(['ACCESS_REVISION_CONFLICT', 'ACCESS_REQUEST_ID_CONFLICT']);
export function accessErrorCode(error: unknown): string | undefined {
  const value = error as { response?: { data?: { code?: unknown; message?: unknown; error?: unknown } }; message?: unknown };
  const data = value?.response?.data;
  // Older ordinary access routes use the exact code as their message. Never
  // search arbitrary exception text or render payloads as machine-readable codes.
  const candidate = data?.code ?? data?.message ?? data?.error ?? value?.message;
  return typeof candidate === 'string' && ACCESS_CONFLICT_CODES.has(candidate) ? candidate : undefined;
}
export const isAccessConflict = (error: unknown) => accessErrorCode(error) !== undefined;
