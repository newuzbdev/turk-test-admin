import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { readingPracticeEndpoints } from "@/config/endpoint";

export const useDeleteReadingPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosPrivate.delete(readingPracticeEndpoints.one(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [readingPracticeEndpoints.adminAll],
      });
      toast.success("Reading practice silindi");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Reading practice silinemedi";
      toast.error(message);
    },
  });
};
