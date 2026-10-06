import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
export interface ExamInput {
  examStart: string;
  examEnd: string;
  registrationStart: string;
  registrationEnd: string;
  paymentEnd: string;
  sourceUrl: string;
  published: boolean;
  version?: number;
}
export interface OfficialExam extends ExamInput {
  id: string;
  version: number;
}
const key = ["admin", "official-exams"];
function unwrap<T>(payload: T | { success: boolean; data: T }): T {
  return payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
    ? payload.data
    : (payload as T);
}
export function useOfficialExams() {
  return useQuery({
    queryKey: key,
    queryFn: async () =>
      unwrap<OfficialExam[]>(
        (await axiosPrivate.get("/api/admin/official-exams")).data,
      ),
  });
}
export function useSaveExam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: ExamInput }) => {
      try {
        return id
          ? await axiosPrivate.patch(
              `/api/admin/official-exams/${encodeURIComponent(id)}`,
              data,
            )
          : await axiosPrivate.post("/api/admin/official-exams", data);
      } catch (error) {
        const e = error as {
          response?: {
            data?: {
              message?: string | string[];
              error?: { message?: string };
            };
          };
        };
        const message =
          e.response?.data?.message ?? e.response?.data?.error?.message;
        throw new Error(
          Array.isArray(message)
            ? message.join(" ")
            : (message ?? "Kaydedilemedi. Lütfen yeniden deneyin."),
        );
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
