import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import axiosPrivate from "@/config/api";
import { ieltsEndpoints } from "@/config/endpoint";
import type { TPaginationWrapper, IELTS } from "@/utils/types/types";

export const useGetAllIelts = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [ieltsEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<IELTS[]>>(
          ieltsEndpoints.all,
          {
            params: {
              page,
              limit,
              search,
            },
          }
        )
      ).data;
    },
  });
};
