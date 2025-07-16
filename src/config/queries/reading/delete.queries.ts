import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type { ApiResponse } from "../../../utils/types/types";
import { readingEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteReadingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return (
        await axiosPrivate.delete<ApiResponse<null>>(readingEndpoints.one(id))
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [readingEndpoints.all] });
      notification.success({
        message: "Reading test muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Reading test o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
