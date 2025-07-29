import axiosPrivate from "@/config/api";
import { testEndpoints } from "@/config/endpoint";
import type { Test, TPaginationWrapper } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useGetAllArchivedTests = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [testEndpoints.all, "ARCHIVED", search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<Test[]>>(
          testEndpoints.all,
          {
            params: {
              page,
              limit,
              search,
              isDeleted: true,
            },
          }
        )
      ).data;
    },
  });
};
