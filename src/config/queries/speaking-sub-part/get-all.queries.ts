import axiosPrivate from "@/config/api";
import { speakingSubPartEndpoints } from "@/config/endpoint";
import type { SpeakingSubPart, TPaginationWrapper } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useGetAllSpeakingSubPart = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [speakingSubPartEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<SpeakingSubPart[]>>(
          speakingSubPartEndpoints.all,
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
