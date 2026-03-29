import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { writingTestEndpoints } from "@/config/endpoint";
import type { ApiResponse, WritingTest } from "@/utils/types/types";

export const useGetOneWritingTest = (id: string) => {
  return useQuery({
    queryKey: ["writing", "one", id],
    queryFn: async () => {
      const response = await axiosPrivate.get<ApiResponse<WritingTest>>(
        writingTestEndpoints.one(id)
      );
      return response.data.data;
    },
    enabled: !!id,
    refetchOnMount: false,
  });
};

export const useGetWritingTestWithAddition = (id: string) => {
  return useQuery({
    queryKey: ["writing", "with-addition", id],
    queryFn: async () => {
      const response = await axiosPrivate.get<WritingTest>(
        writingTestEndpoints.one(id),
        { headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" } }
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
  });
};
