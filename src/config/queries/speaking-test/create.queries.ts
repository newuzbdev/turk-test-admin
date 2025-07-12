import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { speakingTestEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateOnlySpeakingTest,
  CreateSpeakingTest,
  OnlySpeakingTest,
  SpeakingTest,
} from "@/utils/types/types";

export const useCreateSpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingTest) =>
      (
        await axiosPrivate.post<ApiResponse<SpeakingTest>>(
          speakingTestEndpoints.all,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
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

export const useCreateOnlySpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOnlySpeakingTest) =>
      (
        await axiosPrivate.post<ApiResponse<OnlySpeakingTest>>(
          speakingTestEndpoints.only,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.only] });
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
