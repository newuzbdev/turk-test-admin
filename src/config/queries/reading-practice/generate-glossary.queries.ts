import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import axiosPrivate from "@/config/api";
import { readingPracticeEndpoints } from "@/config/endpoint";
import type {
  ReadingPracticeGlossaryGenerationRequest,
  ReadingPracticeGlossaryGenerationResponse,
} from "@/utils/types/types";

type GlossaryGenerationErrorPayload = {
  message?: string;
  error?: string;
};

export const useGenerateReadingPracticeGlossary = () => {
  return useMutation({
    mutationFn: async (data: ReadingPracticeGlossaryGenerationRequest) => {
      const response = await axiosPrivate.post<ReadingPracticeGlossaryGenerationResponse>(
        readingPracticeEndpoints.generateGlossary,
        data,
      );
      return response.data;
    },
    onError: (error: unknown) => {
      const payload = isAxiosError<GlossaryGenerationErrorPayload>(error)
        ? error.response?.data
        : undefined;
      const message =
        payload?.message ||
        payload?.error ||
        "Sözlük oluşturulamadı";
      toast.error(message);
    },
  });
};
