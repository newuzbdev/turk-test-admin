import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type { ApiResponse } from "../../../utils/types/types";
import { writingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteWritingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return (
        await axiosPrivate.delete<ApiResponse<null>>(
          writingTestEndpoints.one(id)
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      notification.success({
        message: "Writing test muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Writing test o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
