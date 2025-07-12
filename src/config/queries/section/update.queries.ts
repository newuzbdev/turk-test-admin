import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type { ApiResponse, Section } from "@/utils/types/types";

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Section>) =>
      (
        await axiosPrivate.patch<ApiResponse<Section>>(
          sectionEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [sectionEndpoints.all] });
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
