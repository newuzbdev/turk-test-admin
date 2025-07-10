import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { ieltsEndpoints } from "@/config/endpoint";
import type { ApiResponse, IELTS } from "@/utils/types/types";

export const useGetOneIelts = (id: string) => {
  return useQuery({
    queryKey: [ieltsEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<IELTS>>(ieltsEndpoints.one(id))
      ).data;
    },
    enabled: !!id,
  });
};
