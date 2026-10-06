import { readExamListView } from "@/shared/components/exam-list-view";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import axiosPrivate from "@/config/api";
import { writingTestEndpoints } from "@/config/endpoint";
import type { TPaginationWrapper, WritingTest } from "@/utils/types/types";

export const useGetAllWritingTests = () => {
  const [searchParams] = useSearchParams();
  const view = readExamListView(searchParams.get("view"));
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [writingTestEndpoints.all, "WRITING", search, page, limit, view],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<WritingTest[]>>(
          writingTestEndpoints.all,
          {
            params: {
              page,
              limit,
              search,
              view,
            },
          },
        )
      ).data;
    },
  });
};
