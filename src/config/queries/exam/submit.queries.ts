import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { examEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type {
  ApiResponse,
  ExamResult,
  ExamSubmission,
} from "@/utils/types/types";

export const useSubmitAllTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ExamSubmission) =>
      (
        await axiosPrivate.post<ApiResponse<ExamResult>>(
          examEndpoints.submitAll,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [examEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [examEndpoints.userAnswers] });
      queryClient.invalidateQueries({ queryKey: [examEndpoints.result] });
      notification.success({
        message: "Test muvaffaqiyatli topshirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Test topshirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
