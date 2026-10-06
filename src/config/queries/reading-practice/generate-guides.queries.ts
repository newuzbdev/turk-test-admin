import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { readingPracticeEndpoints } from "@/config/endpoint";
import type {
  CreateReadingPractice,
  ReadingPracticeGuideGenerationResponse,
} from "@/utils/types/types";

export const useGenerateReadingPracticeGuides = () => {
  return useMutation({
    mutationFn: async (data: CreateReadingPractice) => {
      const response = await axiosPrivate.post<ReadingPracticeGuideGenerationResponse>(
        readingPracticeEndpoints.generateGuides,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("AI ipuçları üretildi");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "AI ipuçları üretilemedi";
      toast.error(message);
    },
  });
};
