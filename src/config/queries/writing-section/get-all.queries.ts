import axiosPrivate from "@/config/api";
import { writingSectionEndpoints } from "@/config/endpoint";
import type { WritingSection, TPaginationWrapper } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useGetAllWritingSections = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const writingTestId = searchParams.get("writingTestId");

  return useQuery({
    queryKey: [writingSectionEndpoints.all, search, page, limit, writingTestId],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<WritingSection[]>>(writingSectionEndpoints.all, {
          params: {
            page,
            limit,
            search,
            writingTestId,
          },
        })
      ).data;
    },
  });
};
