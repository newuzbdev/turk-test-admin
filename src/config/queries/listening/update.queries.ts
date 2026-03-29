import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, OnlyTest, Test } from "../../../utils/types/types";
import { testEndpoints, listeningEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useUpdateListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Test>) =>
      (
        await axiosPrivate.patch<ApiResponse<Test>>(
          testEndpoints.updateTestFullTree(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [testEndpoints.all] });
      toast.success("Listening test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Listening test yangilashda xatolik yuz berdi");
    },
  });
};

export const useUpdateListeningTestWithAddition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) =>
      (
        await axiosPrivate.patch<ApiResponse<Test>>(
          testEndpoints.updateTestFullTree(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key[0] === listeningEndpoints.all ||
            key[0] === testEndpoints.all ||
            (typeof key[0] === "string" && key[0].includes("/api/test"))
          );
        },
      });
    },
    onError: (error: any) => {
      console.error("API Error:", error.response?.data);
      toast.error(error.response?.data?.error || "Listening test yangilashda xatolik yuz berdi");
    },
  });
};

export const useUpdateOnlyListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<OnlyTest>) =>
      (
        await axiosPrivate.patch<ApiResponse<OnlyTest>>(
          testEndpoints.onlyOne(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [testEndpoints.only] });
      toast.success("Listening test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Listening test yangilashda xatolik yuz berdi");
    },
  });
};
