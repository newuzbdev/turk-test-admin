import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingTestEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateWritingTest,
  WritingTest,
} from "@/utils/types/types";

export const useCreateWritingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWritingTest) =>
      (
        await axiosPrivate.post<ApiResponse<WritingTest>>(
          writingTestEndpoints.all,
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
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
