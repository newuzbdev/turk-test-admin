import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notification } from "antd";
import type { ApiResponse, OnlyTest } from "../../../utils/types/types";
import { testEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useUpdateOnlyTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<OnlyTest>) =>
      (
        await axiosPrivate.patch<ApiResponse<OnlyTest>>(
          testEndpoints.onlyOne(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [testEndpoints.only] });
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
