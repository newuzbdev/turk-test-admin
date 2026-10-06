import { readExamListView } from "@/shared/components/exam-list-view";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type {
  TPaginationWrapper,
  OnlySpeakingTest,
} from "../../../utils/types/types";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";
import type {
  SpeakingListResponse,
  SpeakingListRow,
} from "@/pages/speaking-v2/types";

type RawSpeakingListResponse = {
  data?: SpeakingListRow[];
  total?: number;
  page?: number;
  limit?: number;
  meta?: Partial<SpeakingListResponse["meta"]>;
};

export function normalizeSpeakingListResponse(
  payload: RawSpeakingListResponse,
): SpeakingListResponse {
  const page = payload.meta?.page ?? payload.page ?? 1;
  const limit = payload.meta?.limit ?? payload.limit ?? 10;
  const total = payload.meta?.total ?? payload.total ?? 0;

  return {
    data: payload.data ?? [],
    meta: {
      page,
      limit,
      total,
      totalPages:
        payload.meta?.totalPages ?? Math.ceil(total / Math.max(1, limit)),
    },
  };
}

export const useGetAllSpeakingTests = () => {
  const [searchParams] = useSearchParams();
  const view = readExamListView(searchParams.get("view"));
  const search = searchParams.get("search") || "";
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);

  return useQuery({
    queryKey: [speakingTestEndpoints.all, page, limit, view, search],
    queryFn: async () =>
      normalizeSpeakingListResponse(
        (
          await axiosPrivate.get<RawSpeakingListResponse>(
            `${speakingTestEndpoints.all}/admin/list`,
            { params: { page, limit, view, search } },
          )
        ).data,
      ),
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
          },
        )
      ).data;
    },
  });
};
