import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import axiosPrivate from "../../api";
import { listeningEndpoints } from "../../endpoint";

export const useDeleteListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await axiosPrivate.delete(listeningEndpoints.one(id))).data,
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [listeningEndpoints.all],
      });
      notification.success({
        message: "Listening test muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Listening test o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useDeleteOnlyListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await axiosPrivate.delete(listeningEndpoints.onlyOne(id))).data,
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [listeningEndpoints.only],
      });
      notification.success({
        message: "Listening test muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Listening test o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
