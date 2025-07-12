import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingTestEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type { ApiResponse, WritingTest } from "@/utils/types/types";

export const useUpdateWritingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<WritingTest>) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingTest>>(
          writingTestEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
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
