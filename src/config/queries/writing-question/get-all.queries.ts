import axiosPrivate from "@/config/api";
import { writingQuestionEndpoints } from "@/config/endpoint";
import type { WritingQuestion, TPaginationWrapper } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useGetAllWritingQuestions = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const writingSectionId = searchParams.get("writingSectionId");
  const writingSubPartId = searchParams.get("writingSubPartId");

  return useQuery({
    queryKey: [writingQuestionEndpoints.all, search, page, limit, writingSectionId, writingSubPartId],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<WritingQuestion[]>>(writingQuestionEndpoints.all, {
          params: {
            page,
            limit,
            search,
            writingSectionId,
            writingSubPartId,
          },
        })
      ).data;
    },
  });
};
