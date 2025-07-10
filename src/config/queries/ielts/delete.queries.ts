import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import axiosPrivate from "@/config/api";
import { ieltsEndpoints } from "@/config/endpoint";

export const useDeleteIelts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await axiosPrivate.delete(ieltsEndpoints.one(id))).data,
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [ieltsEndpoints.all],
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
