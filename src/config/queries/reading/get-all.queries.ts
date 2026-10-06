import { readExamListView } from "@/shared/components/exam-list-view";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import axiosPrivate from "@/config/api";
import { readingEndpoints } from "@/config/endpoint";
import type { TPaginationWrapper, Test } from "@/utils/types/types";

export const useGetAllReadingTests = () => {
  const [searchParams] = useSearchParams();
  const view = readExamListView(searchParams.get("view"));
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [readingEndpoints.only, "READING", search, page, limit, view],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<Test[]>>(
          readingEndpoints.only,
          {
            params: {
              page,
              limit,
              search,
              view,
              type: "READING", // Filter by reading type
            },
          },
        )
      ).data;
    },
  });
};
