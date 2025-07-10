import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateIELTS,
  IELTS,
} from "../../../utils/types/types";
import axiosPrivate from "../../api";
import { ieltsEndpoints } from "../../endpoint";

export const useCreateIelts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateIELTS) =>
      (await axiosPrivate.post<ApiResponse<IELTS>>(ieltsEndpoints.all, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ieltsEndpoints.all] });
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
