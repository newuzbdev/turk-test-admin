import axiosPrivate from "@/config/api";
import { writingTestEndpoints } from "@/config/endpoint";
import type { TPaginationWrapper, WritingTest } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useGetAllWritingTest = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [writingTestEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<WritingTest[]>>(
          writingTestEndpoints.all,
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
