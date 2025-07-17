import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteSpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await axiosPrivate.delete(speakingTestEndpoints.one(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.only] });
      notification.success({
        message: "Speaking test muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking test o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
