import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { studentsEndpoints } from "@/config/endpoint";
import type {
  StudentActivityResponse,
  StudentFilters,
  StudentLiveFilters,
  StudentLiveResponse,
} from "@/config/queries/students";

// The JWT subject only partitions client caches. The server remains the authority
// for signature, role and ownership; tokens are never placed in keys or data.
export function currentAdminId(): string {
  try {
    const payload = JSON.parse(
      atob(
        (localStorage.getItem("accessToken") ?? "")
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/"),
      ),
    );
    return payload.role === "ADMIN" && typeof payload.id === "string"
      ? payload.id
      : "";
  } catch {
    return "";
  }
}
export const studentLiveQueryKey = (
  filters: StudentLiveFilters,
  adminId: string,
) => ["admin", "students", "live", filters, adminId] as const;
export const studentActivityQueryKey = (
  id: string,
  filters: StudentFilters,
  adminId: string,
) => ["admin", "student-activity", id, filters, adminId] as const;
export function useDocumentVisible() {
  const [visible, setVisible] = useState(
    document.visibilityState === "visible",
  );
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}
function useAdminId() {
  const [id, setId] = useState(currentAdminId);
  useEffect(() => {
    const update = () => setId(currentAdminId());
    // Storage events handle other tabs; this bounded check also observes the
    // existing same-tab auth provider's localStorage writes without changing it.
    const timer = window.setInterval(update, 500);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    update();
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, []);
  return currentAdminId() === id ? id : "";
}
async function activityGet<T>(
  url: string,
  params: object,
  signal: AbortSignal,
  adminId: string,
): Promise<T> {
  if (!adminId || currentAdminId() !== adminId)
    throw new Error("Yönetici oturumu değişti.");
  const response = await axiosPrivate.get(url, {
    params,
    signal,
    headers: { "Cache-Control": "no-store" },
  });
  if (signal.aborted || currentAdminId() !== adminId)
    throw new Error("Yönetici oturumu değişti.");
  if (response.data?.success === false)
    throw new Error("Öğrenci etkinliği yüklenemedi.");
  return response.data.data;
}
function useActivityQuery<T>(
  key: readonly unknown[],
  url: string,
  params: object,
  adminId: string,
  enabled: boolean,
  visible: boolean,
  poll: boolean,
) {
  const client = useQueryClient();
  const query = useQuery<T>({
    queryKey: key,
    queryFn: ({ signal }) => activityGet<T>(url, params, signal, adminId),
    enabled: enabled && visible && !!adminId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: enabled && visible && !!adminId && poll ? 20_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    meta: { persist: false },
  });
  const keyString = JSON.stringify(key);
  useEffect(() => {
    if (!enabled || !visible || !adminId)
      void client.cancelQueries({ queryKey: key, exact: true });
    return () => {
      void client.cancelQueries({ queryKey: key, exact: true });
    };
    // Stable structural identity avoids cancelling on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, keyString, enabled, visible, adminId]);
  return query;
}
export function useStudentLiveQuery(
  filters: StudentLiveFilters,
  options: { enabled: boolean; visible: boolean },
) {
  const adminId = useAdminId();
  return useActivityQuery<StudentLiveResponse>(
    studentLiveQueryKey(filters, adminId),
    studentsEndpoints.live,
    filters,
    adminId,
    options.enabled,
    options.visible,
    true,
  );
}
export function useStudentActivityQuery(
  id: string,
  filters: StudentFilters,
  options: { enabled: boolean; visible: boolean },
) {
  const adminId = useAdminId();
  return useActivityQuery<StudentActivityResponse>(
    studentActivityQueryKey(id, filters, adminId),
    studentsEndpoints.activity(id),
    filters,
    adminId,
    options.enabled && !!id,
    options.visible,
    false,
  );
}
export function useActivityFreshness(
  observedAt: string | undefined,
  hasError: boolean,
  fetchedAfterMount: boolean,
) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const observed = Date.parse(observedAt ?? "");
  return (
    fetchedAfterMount &&
    !hasError &&
    Number.isFinite(observed) &&
    now - observed <= 90_000
  );
}
