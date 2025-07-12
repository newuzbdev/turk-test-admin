import axiosPrivate from "@/config/api";
import { writingSubPartEndpoints } from "@/config/endpoint";
import type { TPaginationWrapper, WritingSubPart } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useGetAllWritingSubPart = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [writingSubPartEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<WritingSubPart[]>>(
          writingSubPartEndpoints.all,
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
