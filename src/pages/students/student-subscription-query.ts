import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { subscriptionEndpoints } from "@/config/endpoint";
import { currentAdminId } from "./student-live-query";

// Privileged subscription requests capture their own Authorization. They never
// share the mutable-token or automatic-refresh interceptors of the general API.
export const adminSubscriptionTransport = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.turkishmock.uz",
  withCredentials: false,
  timeout: 30_000,
});
adminSubscriptionTransport.interceptors.request.use((config) => {
  const guarded = config as InternalAxiosRequestConfig & {
    subscriptionAdminId: string;
  };
  requireAdmin(guarded.subscriptionAdminId, config.signal);
  return config;
});

export type SubscriptionBucket =
  "MOCK_WRITING" | "MOCK_SPEAKING" | "PRACTICE_AI";
export type StudentSubscriptionAction =
  "RENEW" | "EXTEND" | "ADD_QUOTA" | "REDUCE_QUOTA" | "CANCEL";
export type StudentSubscriptionState = {
  version: string;
  subscription: null | {
    id: string;
    userId: string;
    status: "ACTIVE" | "EXPIRED" | "SCHEDULED" | "CANCELLED";
    periodStart: string;
    periodEnd: string;
    quotas: Record<
      SubscriptionBucket,
      { granted: number; used: number; remaining: number }
    >;
  };
  plan: { periodDays: number; quotas: Record<SubscriptionBucket, number> };
  history: Array<{
    id: string;
    actorId: string;
    action: StudentSubscriptionAction;
    reason: string;
    occurredAt: string;
  }>;
};
export type StudentSubscriptionPayload = {
  requestId: string;
  expectedVersion: string;
  action: StudentSubscriptionAction;
  reason: string;
  confirmed: true;
  days?: number;
  writingMock?: number;
  speakingMock?: number;
  practiceAi?: number;
};
export const subscriptionActionLabels = {
  RENEW: "Üyeliği yenile",
  EXTEND: "Süre uzat",
  ADD_QUOTA: "Hak ekle",
  REDUCE_QUOTA: "Hak azalt",
  CANCEL: "Üyeliği iptal et",
};
export function subscriptionTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    timeZone: "Asia/Tashkent",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export const studentSubscriptionKey = (userId: string, adminId: string) =>
  ["admin", "student-subscription", userId, adminId] as const;

export function useSubscriptionAdminId() {
  const [id, setId] = useState(currentAdminId);
  useEffect(() => {
    const update = () => setId(currentAdminId());
    const timer = window.setInterval(update, 500);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    update();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, []);
  return currentAdminId() === id ? id : "";
}
function requireAdmin(adminId: string, signal?: { aborted: boolean }) {
  if (!adminId || signal?.aborted || currentAdminId() !== adminId)
    throw new Error("Yönetici oturumu değişti.");
}
function privateRequest(adminId: string, signal?: AbortSignal) {
  requireAdmin(adminId, signal);
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Yönetici oturumu değişti.");
  requireAdmin(adminId, signal);
  return {
    signal,
    subscriptionAdminId: adminId,
    headers: {
      "Cache-Control": "no-store",
      Authorization: `Bearer ${token}`,
    },
  };
}
export async function adminAccountRequest<T>(
  method: "get" | "post" | "patch",
  url: string,
  expectedAdminId: string,
  body?: object,
  signal?: AbortSignal,
  params?: object,
): Promise<T> {
  const response = await adminSubscriptionTransport.request<T>({
    ...privateRequest(expectedAdminId, signal),
    method,
    url,
    data: body,
    params,
  });
  requireAdmin(expectedAdminId, signal);
  return response.data;
}
export async function adminSubscriptionGet<T>(
  url: string,
  adminId: string,
  signal: AbortSignal,
  params?: object,
): Promise<T> {
  return adminAccountRequest<T>("get", url, adminId, undefined, signal, params);
}
function unwrapState(
  envelope: { success: boolean; data: StudentSubscriptionState },
  userId: string,
) {
  const state = envelope?.data;
  if (
    envelope?.success !== true ||
    !state ||
    !/^[0-9a-f]{64}$/i.test(state.version) ||
    !state.plan ||
    !state.plan.quotas ||
    !Array.isArray(state.history) ||
    (state.subscription !== null &&
      (!state.subscription || state.subscription.userId !== userId))
  )
    throw new Error("Üyelik bilgileri doğrulanamadı.");
  return state;
}
export function useStudentSubscriptionQuery(userId: string) {
  const adminId = useSubscriptionAdminId();
  const client = useQueryClient();
  const queryKey = studentSubscriptionKey(userId, adminId);
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) =>
      unwrapState(
        await adminSubscriptionGet<{
          success: boolean;
          data: StudentSubscriptionState;
        }>(subscriptionEndpoints.adminStudent(userId), adminId, signal),
        userId,
      ),
    enabled: !!userId && !!adminId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    meta: { persist: false },
  });
  useEffect(
    () => () => {
      void client.cancelQueries({
        queryKey: studentSubscriptionKey(userId, adminId),
        exact: true,
      });
    },
    [client, userId, adminId],
  );
  return { ...query, adminId, data: adminId ? query.data : undefined };
}
export async function writeStudentSubscription(
  userId: string,
  adminId: string,
  payload: StudentSubscriptionPayload,
): Promise<StudentSubscriptionState> {
  const response = await adminAccountRequest<{
    success: boolean;
    data: StudentSubscriptionState;
  }>("patch", subscriptionEndpoints.adminStudent(userId), adminId, payload);
  return unwrapState(response, userId);
}
