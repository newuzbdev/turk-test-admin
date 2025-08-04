import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { ieltsEndpoints } from "@/config/endpoint";
import type { ApiResponse, IELTS } from "@/utils/types/types";

export const useUpdateIelts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<IELTS>) =>
      (
        await axiosPrivate.patch<ApiResponse<IELTS>>(
          ieltsEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ieltsEndpoints.all] });
      toast.success("Muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Yangilashda xatolik yuz berdi");
    },
  });
};
