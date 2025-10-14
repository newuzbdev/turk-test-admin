import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, Banner } from "../../../utils/types/types";
import { bannerEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetOneBanner = (id: string) => {
  return useQuery({
    queryKey: [bannerEndpoints.one(id)],
    queryFn: async () => {
      const response = await axiosPrivate.get<ApiResponse<Banner>>(bannerEndpoints.one(id));
      return response.data;
    },
    enabled: !!id,
  });
};


