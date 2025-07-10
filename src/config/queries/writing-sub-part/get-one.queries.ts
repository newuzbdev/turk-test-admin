import axiosPrivate from "@/config/api";
import { writingSubPartEndpoints } from "@/config/endpoint";
import type { ApiResponse, WritingSubPart } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneWritingSubPart = (id: string) => {
  return useQuery({
    queryKey: [writingSubPartEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<WritingSubPart>>(
          writingSubPartEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
