import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingSubPartEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateWritingSubPart,
  WritingSubPart,
} from "@/utils/types/types";

export const useCreateWritingSubPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWritingSubPart) =>
      (
        await axiosPrivate.post<ApiResponse<WritingSubPart>>(
          writingSubPartEndpoints.all,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [writingSubPartEndpoints.all],
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
