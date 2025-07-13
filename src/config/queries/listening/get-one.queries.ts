import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, OnlyTest, Test } from "../../../utils/types/types";
import { listeningEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetOneListeningTest = (id: string) => {
  return useQuery({
    queryKey: [listeningEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<Test>>(listeningEndpoints.one(id))
      ).data;
    },
    enabled: !!id,
  });
};

export const useGetOneOnlyListeningTest = (id: string) => {
  return useQuery({
    queryKey: [listeningEndpoints.onlyOne(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<OnlyTest>>(
          listeningEndpoints.onlyOne(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
