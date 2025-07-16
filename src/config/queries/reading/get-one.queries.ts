import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, OnlyTest, Test } from "../../../utils/types/types";
import { readingEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetOneReadingTest = (id: string) => {
  return useQuery({
    queryKey: [readingEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<Test>>(readingEndpoints.one(id))
      ).data;
    },
    enabled: !!id,
  });
};

export const useGetOneOnlyReadingTest = (id: string) => {
  return useQuery({
    queryKey: [readingEndpoints.onlyOne(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<OnlyTest>>(
          readingEndpoints.onlyOne(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
