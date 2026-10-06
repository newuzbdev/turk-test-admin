import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { readingPracticeEndpoints } from "@/config/endpoint";
import type { CreateReadingPractice } from "@/utils/types/types";
import { readingPracticeSavePayload } from './save-payload';

export const useCreateReadingPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async (data: CreateReadingPractice) => {
      const response = await axiosPrivate.post(readingPracticeEndpoints.all, readingPracticeSavePayload(data));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [readingPracticeEndpoints.adminAll],
      });
      toast.success("Reading practice oluşturuldu");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Reading practice oluşturulamadı";
      toast.error(message);
    },
  });
};
