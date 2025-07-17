import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { writingTestEndpoints } from "@/config/endpoint";
import type { ApiResponse, WritingTest } from "@/utils/types/types";

export const useGetOneWritingTest = (id: string) => {
  return useQuery({
    queryKey: [writingTestEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<WritingTest>>(
          writingTestEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
