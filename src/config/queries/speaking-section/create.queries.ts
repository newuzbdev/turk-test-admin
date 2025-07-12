import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { speakingSectionEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateSpeakingSection,
  SpeakingSection,
} from "@/utils/types/types";

export const useCreateSpeakingSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingSection) =>
      (
        await axiosPrivate.post<ApiResponse<SpeakingSection>>(
          speakingSectionEndpoints.all,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [speakingSectionEndpoints.all],
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
