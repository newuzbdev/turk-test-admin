import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
      toast.success("Listening test muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Listening test o'chirishda xatolik yuz berdi");
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
      toast.success("Listening test muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Listening test o'chirishda xatolik yuz berdi");
    },
  });
};
