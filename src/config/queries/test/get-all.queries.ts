import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type {
  OnlyTest,
  Test,
  TPaginationWrapper,
} from "../../../utils/types/types";
import { testEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetAllTestWithAddition = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [testEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<Test[]>>(testEndpoints.all, {
          params: {
            page,
            limit,
            search,
          },
        })
      ).data;
    },
  });
};

export const useGetAllOnlyTest = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [testEndpoints.only, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<OnlyTest[]>>(
          testEndpoints.only,
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
