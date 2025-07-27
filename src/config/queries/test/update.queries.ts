import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, OnlyTest } from "../../../utils/types/types";
import { testEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useUpdateOnlyTest = () => {
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
      toast.success("Muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Yangilashda xatolik yuz berdi");
    },
  });
};
