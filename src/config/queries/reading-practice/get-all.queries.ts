import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { readingPracticeEndpoints } from "@/config/endpoint";
import type {
  ReadingPracticeListQuery,
  ReadingPracticeListResponse,
} from "@/utils/types/types";

export const useGetAllReadingPractice = (query: ReadingPracticeListQuery) => {
  return useQuery({
    queryKey: [readingPracticeEndpoints.adminAll, query],
    queryFn: async () => {
      const response = await axiosPrivate.get<ReadingPracticeListResponse>(
        readingPracticeEndpoints.adminAll,
        { params: query },
      );
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
