import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import axiosPrivate from "../../api";
import { testEndpoints } from "../../endpoint";

export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await axiosPrivate.delete(testEndpoints.one(id))).data,
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [testEndpoints.all],
      });
      notification.success({
        message: "Muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "O'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useDeleteOnlyTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await axiosPrivate.delete(testEndpoints.onlyOne(id))).data,
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [testEndpoints.only],
      });
      notification.success({
        message: "Muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "O'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
