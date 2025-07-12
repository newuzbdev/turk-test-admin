import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { speakingPointEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateSpeakingPoint,
  SpeakingPoint,
} from "@/utils/types/types";

export const useCreateSpeakingPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingPoint) =>
      (
        await axiosPrivate.post<ApiResponse<SpeakingPoint>>(
          speakingPointEndpoints.all,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingPointEndpoints.all] });
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
