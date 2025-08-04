import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingSubPartEndpoints, writingSectionEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, WritingSubPart } from "@/utils/types/types";

interface CreateWritingSubPartDto {
  title: string;
  description?: string;
  content?: string;
  order: number;
  writingSectionId: string;
}

export const useCreateWritingSubPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWritingSubPartDto) =>
      (await axiosPrivate.post<ApiResponse<WritingSubPart>>(writingSubPartEndpoints.all, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      toast.success("Writing subpart muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Writing subpart yaratishda xatolik yuz berdi");
    },
  });
};
