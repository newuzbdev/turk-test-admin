import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "../../api";
import { testEndpoints } from "../../endpoint";

export const listeningAuthoringErrorCode = (error: unknown): string | undefined => {
  const body = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
  for (const candidate of [body, body?.response, body?.error, body?.data]) {
    if (candidate && typeof candidate === "object" && "code" in candidate && typeof candidate.code === "string") {
      return candidate.code;
    }
  }
  return undefined;
};

export const useReviseListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      (await axiosPrivate.post(testEndpoints.reviseTestFullTree(id), data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].includes("/api/test"),
      });
      toast.success("Yeni taslak sürüm oluşturuldu");
    },
    onError: () => toast.error("Yeni sürüm oluşturulamadı. Değişiklikleriniz editörde korunuyor."),
  });
};

export const loadListeningAuthoringTest = async (id: string) =>
  (await axiosPrivate.get(testEndpoints.testAddition(id))).data;
