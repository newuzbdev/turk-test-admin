import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, OnlyTest, Test } from "../../../utils/types/types";
import { testEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetOneTestWithAddition = (id: string) => {
  return useQuery({
    queryKey: [testEndpoints.one(id)],
    queryFn: async () => {
      return (await axiosPrivate.get<ApiResponse<Test>>(testEndpoints.one(id)))
        .data;
    },
    enabled: !!id,
  });
};

export const useGetOneOnlyTest = (id: string) => {
  return useQuery({
    queryKey: [testEndpoints.onlyOne(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<OnlyTest>>(testEndpoints.onlyOne(id))
      ).data;
    },
    enabled: !!id,
  });
};
