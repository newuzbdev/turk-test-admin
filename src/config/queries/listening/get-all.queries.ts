import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type {
  OnlyTest,
  Test,
  TPaginationWrapper,
} from "../../../utils/types/types";
import { listeningEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetAllListeningTests = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [listeningEndpoints.all, "LISTENING", search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<Test[]>>(
          listeningEndpoints.all,
          {
            params: {
              page,
              limit,
              search,
              type: "LISTENING",
            },
          }
        )
      ).data;
    },
  });
};

export const useGetAllOnlyListeningTests = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [listeningEndpoints.only, "LISTENING", search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<OnlyTest[]>>(
          listeningEndpoints.only,
          {
            params: {
              page,
              limit,
              search,
              type: "LISTENING",
            },
          }
        )
      ).data;
    },
  });
};
