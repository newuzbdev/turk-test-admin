import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { testEndpoints } from "@/config/endpoint";
import type { ApiResponse, OnlyTest } from "@/utils/types/types";

export const useRestoreTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return (
        await axiosPrivate.patch<ApiResponse<OnlyTest>>(
          testEndpoints.onlyOne(id),
          { isDeleted: false }
        )
      ).data;
    },
    onSuccess: () => {
      // Invalidate both archive and main test queries
      queryClient.invalidateQueries({ queryKey: [testEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [testEndpoints.only] });
      toast.success("Test muvaffaqiyatli qayta tiklandi");
    },
    onError: () => {
      toast.error("Test qayta tiklashda xatolik yuz berdi");
    },
  });
};
