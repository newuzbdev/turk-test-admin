import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
      toast.success("Speaking test muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Speaking test o'chirishda xatolik yuz berdi");
    },
  });
};
