import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  SpeakingTest,
} from "../../../utils/types/types";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

interface UpdateSpeakingTestDto {
  id: string;
  title: string;
  ieltsId: string;
}

export const useUpdateSpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSpeakingTestDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<SpeakingTest>>(
          speakingTestEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.only] });
      notification.success({
        message: "Speaking test muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking test yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
