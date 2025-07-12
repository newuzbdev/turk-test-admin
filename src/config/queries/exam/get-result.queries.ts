import axiosPrivate from "@/config/api";
import { examEndpoints } from "@/config/endpoint";
import type { ApiResponse, ExamResult } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneUserTestResults = (userId?: string, testId?: string) => {
  return useQuery({
    queryKey: [examEndpoints.result, userId, testId],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<ExamResult>>(examEndpoints.result, {
          params: {
            userId,
            testId,
          },
        })
      ).data;
    },
    enabled: !!userId && !!testId,
  });
};
