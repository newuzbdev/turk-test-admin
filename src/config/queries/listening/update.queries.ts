import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, OnlyTest, Test } from "../../../utils/types/types";
import { listeningEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useUpdateListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Test>) =>
      (
        await axiosPrivate.patch<ApiResponse<Test>>(
          listeningEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listeningEndpoints.all] });
      toast.success("Listening test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Listening test yangilashda xatolik yuz berdi");
    },
  });
};

export const useUpdateOnlyListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<OnlyTest>) =>
      (
        await axiosPrivate.patch<ApiResponse<OnlyTest>>(
          listeningEndpoints.onlyOne(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listeningEndpoints.only] });
      toast.success("Listening test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Listening test yangilashda xatolik yuz berdi");
    },
  });
};
