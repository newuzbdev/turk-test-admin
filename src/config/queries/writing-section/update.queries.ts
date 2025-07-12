import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingSectionEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type { ApiResponse, WritingSection } from "@/utils/types/types";

export const useUpdateWritingSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<WritingSection>) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSection>>(
          writingSectionEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [writingSectionEndpoints.all],
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
