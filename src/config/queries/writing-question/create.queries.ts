import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingQuestionEndpoints, writingSectionEndpoints, writingSubPartEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, WritingQuestion } from "@/utils/types/types";

interface CreateWritingQuestionDto {
  text: string;
  order: number;
  writingSectionId?: string;
  writingSubPartId?: string;
}

export const useCreateWritingQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWritingQuestionDto) =>
      (await axiosPrivate.post<ApiResponse<WritingQuestion>>(writingQuestionEndpoints.all, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      toast.success("Writing question muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Writing question yaratishda xatolik yuz berdi");
    },
  });
};
