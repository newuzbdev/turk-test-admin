import axiosPrivate from "@/config/api";
import { answerEndpoints } from "@/config/endpoint";
import type { Answer, ApiResponse } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneAnswer = (id: string) => {
  return useQuery({
    queryKey: [answerEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<Answer>>(answerEndpoints.one(id))
      ).data;
    },
    enabled: !!id,
  });
};
