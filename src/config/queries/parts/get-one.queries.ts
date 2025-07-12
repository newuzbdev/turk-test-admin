import axiosPrivate from "@/config/api";
import { partsEndpoints } from "@/config/endpoint";
import type { ApiResponse, Part } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOnePart = (id: string) => {
  return useQuery({
    queryKey: [partsEndpoints.one(id)],
    queryFn: async () => {
      return (await axiosPrivate.get<ApiResponse<Part>>(partsEndpoints.one(id)))
        .data;
    },
    enabled: !!id,
  });
};
