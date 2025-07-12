import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { speakingQuestionEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateSpeakingQuestion,
  SpeakingQuestion,
} from "@/utils/types/types";

export const useCreateSpeakingQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingQuestion) =>
      (
        await axiosPrivate.post<ApiResponse<SpeakingQuestion>>(
          speakingQuestionEndpoints.all,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [speakingQuestionEndpoints.all],
      });
      notification.success({
        message: "Muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useCreateSubPartQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingQuestion) =>
      (
        await axiosPrivate.post<ApiResponse<SpeakingQuestion>>(
          speakingQuestionEndpoints.subpartQuestions,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [speakingQuestionEndpoints.all],
      });
      queryClient.invalidateQueries({
        queryKey: [speakingQuestionEndpoints.subpartQuestions],
      });
      notification.success({
        message: "Muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
