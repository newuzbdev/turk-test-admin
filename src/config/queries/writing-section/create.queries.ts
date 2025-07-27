import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingSectionEndpoints, writingTestEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, WritingSection } from "@/utils/types/types";

interface CreateWritingSectionDto {
  title: string;
  description?: string;
  content?: string;
  order: number;
  writingTestId: string;
}

export const useCreateWritingSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWritingSectionDto) =>
      (await axiosPrivate.post<ApiResponse<WritingSection>>(writingSectionEndpoints.all, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing section muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Writing section yaratishda xatolik yuz berdi");
    },
  });
};
