import axiosPrivate from "@/config/api";
import { speakingQuestionEndpoints } from "@/config/endpoint";
import type { ApiResponse, SpeakingQuestion } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneSpeakingQuestion = (id: string) => {
  return useQuery({
    queryKey: [speakingQuestionEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingQuestion>>(
          speakingQuestionEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
