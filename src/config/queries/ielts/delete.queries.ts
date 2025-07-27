import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
      toast.success("Muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("O'chirishda xatolik yuz berdi");
    },
  });
};
