import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import axiosPrivate from "@/config/api";
import { readingEndpoints } from "@/config/endpoint";
import type { TPaginationWrapper, Test } from "@/utils/types/types";

export const useGetAllReadingTests = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [readingEndpoints.all, "READING", search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<Test[]>>(
          readingEndpoints.all,
          {
            params: {
              page,
              limit,
              search,
              type: "READING", // Filter by reading type
            },
          }
        )
      ).data;
    },
  });
};
