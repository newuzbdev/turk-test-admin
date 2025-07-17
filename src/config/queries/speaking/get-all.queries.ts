import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type {
  TPaginationWrapper,
  SpeakingTest,
  OnlySpeakingTest,
} from "../../../utils/types/types";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetAllSpeakingTests = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [speakingTestEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<SpeakingTest[]>>(
          speakingTestEndpoints.all,
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

export const useGetAllOnlySpeakingTests = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [speakingTestEndpoints.only, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<OnlySpeakingTest[]>>(
          speakingTestEndpoints.only,
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
