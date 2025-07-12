import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partsEndpoints } from "@/config/endpoint";
import { notification } from "antd";
import type { ApiResponse, Part } from "@/utils/types/types";

export const useUpdatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Part>) =>
      (
        await axiosPrivate.patch<ApiResponse<Part>>(
          partsEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [partsEndpoints.all] });
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
