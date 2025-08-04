import axiosPrivate from "@/config/api";
import { writingQuestionEndpoints } from "@/config/endpoint";
import type { ApiResponse, WritingQuestion } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneWritingQuestion = (id: string) => {
  return useQuery({
    queryKey: [writingQuestionEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<WritingQuestion>>(writingQuestionEndpoints.one(id))
      ).data;
    },
    enabled: !!id,
  });
};
