import axiosPrivate from "@/config/api";
import { partsEndpoints } from "@/config/endpoint";
import type { Part, TPaginationWrapper } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useGetAllParts = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [partsEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<Part[]>>(partsEndpoints.all, {
          params: {
            page,
            limit,
            search,
          },
        })
      ).data;
    },
  });
};
