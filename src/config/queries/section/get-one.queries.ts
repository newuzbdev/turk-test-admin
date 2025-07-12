import axiosPrivate from "@/config/api";
import { sectionEndpoints } from "@/config/endpoint";
import type { ApiResponse, Section } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneSection = (id: string) => {
  return useQuery({
    queryKey: [sectionEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<Section>>(sectionEndpoints.one(id))
      ).data;
    },
    enabled: !!id,
  });
};
