import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { speakingSubPartEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type { ApiResponse, SpeakingSubPart } from "@/utils/types/types";

export const useUpdateSpeakingSubPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<SpeakingSubPart>) =>
      (
        await axiosPrivate.patch<ApiResponse<SpeakingSubPart>>(
          speakingSubPartEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [speakingSubPartEndpoints.all],
      });
      notification.success({
        message: "Muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
