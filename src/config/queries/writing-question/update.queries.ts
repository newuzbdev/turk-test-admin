import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingQuestionEndpoints, writingSectionEndpoints, writingSubPartEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, WritingQuestion } from "@/utils/types/types";

// General writing question update
export const useUpdateWritingQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<WritingQuestion>) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingQuestion>>(
          writingQuestionEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      toast.success("Writing question muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing question yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing question text
interface UpdateWritingQuestionTextDto {
  id: string;
  text: string;
}

export const useUpdateWritingQuestionText = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: UpdateWritingQuestionTextDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingQuestion>>(
          writingQuestionEndpoints.updateText(id),
          { text }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      toast.success("Writing question text muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing question text yangilashda xatolik yuz berdi");
    },
  });
};

// Update writing question order
interface UpdateWritingQuestionOrderDto {
  id: string;
  order: number;
}

export const useUpdateWritingQuestionOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, order }: UpdateWritingQuestionOrderDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingQuestion>>(
          writingQuestionEndpoints.updateOrder(id),
          { order }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      toast.success("Writing question order muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing question order yangilashda xatolik yuz berdi");
    },
  });
};
