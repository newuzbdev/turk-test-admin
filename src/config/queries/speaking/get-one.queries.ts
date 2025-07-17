import { useQuery } from "@tanstack/react-query";
import type {
  ApiResponse,
  SpeakingTest,
  OnlySpeakingTest,
} from "../../../utils/types/types";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetOneSpeakingTest = (id: string) => {
  return useQuery({
    queryKey: [speakingTestEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingTest>>(
          speakingTestEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};

export const useGetOneOnlySpeakingTest = (id: string) => {
  return useQuery({
    queryKey: [speakingTestEndpoints.onlyOne(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<OnlySpeakingTest>>(
          speakingTestEndpoints.onlyOne(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
