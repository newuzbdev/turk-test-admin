import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { readingPracticeEndpoints } from "@/config/endpoint";
import type { UpdateReadingPractice } from "@/utils/types/types";
import { readingPracticeSavePayload } from './save-payload';

export const useUpdateReadingPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({ id, ...data }: UpdateReadingPractice) => {
      const response = await axiosPrivate.patch(
        readingPracticeEndpoints.one(id),
        readingPracticeSavePayload(data)
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [readingPracticeEndpoints.adminAll],
      });
      queryClient.invalidateQueries({
        queryKey: [readingPracticeEndpoints.adminOne(variables.id), variables.id],
      });
      toast.success("Reading practice güncellendi");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Reading practice güncellenemedi";
      toast.error(message);
    },
  });
};
