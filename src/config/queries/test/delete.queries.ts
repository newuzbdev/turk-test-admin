import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
      toast.success("Muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("O'chirishda xatolik yuz berdi");
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
      toast.success("Muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("O'chirishda xatolik yuz berdi");
    },
  });
};
