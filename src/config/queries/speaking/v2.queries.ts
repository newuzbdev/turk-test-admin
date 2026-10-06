import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import axiosPrivate from "@/config/api";
import { speakingTestEndpoints } from "@/config/endpoint";
import type {
  SpeakingAdminView,
  SpeakingV2AdminView,
  SpeakingV2PromptKey,
  SpeakingV2UpdateInput,
} from "@/pages/speaking-v2/types";

export const speakingV2Endpoints = {
  create: speakingTestEndpoints.v2,
  detail: speakingTestEndpoints.v2One,
  publish: speakingTestEndpoints.publishV2,
  prepareAudio: speakingTestEndpoints.prepareAudioV2,
  audio: speakingTestEndpoints.audioV2,
  deleteAudio: speakingTestEndpoints.deleteAudioV2,
  revise: speakingTestEndpoints.reviseV2,
  archive: speakingTestEndpoints.archiveV2,
  delete: speakingTestEndpoints.deleteV2,
};

export const speakingV2Keys = {
  all: ["speaking-v2"] as const,
  detail: (id: string) => [...speakingV2Keys.all, "detail", id] as const,
};

export const speakingV2ListKey = [speakingTestEndpoints.all] as const;

// A fresh, read-only check before generating any paid publication audio.
export const checkSpeakingV2Publication = async (id: string) =>
  (await axiosPrivate.get<{ available: boolean }>(speakingTestEndpoints.publicationCheckV2(id))).data;

const getErrorCode = (error: unknown): string | null => {
  if (typeof error !== "object" || error === null) return null;

  const response = "response" in error ? error.response : undefined;
  if (typeof response !== "object" || response === null || !("data" in response)) {
    return null;
  }

  const data = response.data;
  return typeof data === "object" &&
    data !== null &&
    "code" in data &&
    typeof data.code === "string"
    ? data.code
    : null;
};

const getErrorStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null) return null;

  const response = "response" in error ? error.response : undefined;
  return typeof response === "object" &&
    response !== null &&
    "status" in response &&
    typeof response.status === "number"
    ? response.status
    : null;
};

export const isSpeakingEditConflictError = (error: unknown) =>
  getErrorCode(error) === "SPEAKING_EDIT_CONFLICT" &&
  getErrorStatus(error) === 409;

const refreshSpeakingCaches = (
  queryClient: QueryClient,
  test: SpeakingAdminView,
) => {
  queryClient.setQueryData(speakingV2Keys.detail(test.id), test);
  queryClient.invalidateQueries({ queryKey: speakingV2Keys.detail(test.id) });
  queryClient.invalidateQueries({ queryKey: speakingV2ListKey });
};

type SpeakingV2MutationCacheOptions = {
  autoCommit?: boolean;
};

export const useSpeakingV2 = (id: string) =>
  useQuery({
    queryKey: speakingV2Keys.detail(id),
    queryFn: async () =>
      (
        await axiosPrivate.get<SpeakingAdminView>(
          speakingV2Endpoints.detail(id),
        )
      ).data,
    enabled: Boolean(id),
    staleTime: 0,
  });

export const useCreateSpeakingV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; ieltsId: string }) =>
      (
        await axiosPrivate.post<SpeakingV2AdminView>(
          speakingV2Endpoints.create,
          input,
        )
      ).data,
    onSuccess: (test) => refreshSpeakingCaches(queryClient, test),
  });
};

export const useUpdateSpeakingV2 = (
  options: SpeakingV2MutationCacheOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: SpeakingV2UpdateInput;
    }) =>
      (
        await axiosPrivate.patch<SpeakingV2AdminView>(
          speakingV2Endpoints.detail(id),
          input,
          { timeout: 20_000 },
        )
      ).data,
    onSuccess:
      options.autoCommit === false
        ? undefined
        : (test) => refreshSpeakingCaches(queryClient, test),
  });
};

export const useGenerateSpeakingPromptAudio = (
  options: SpeakingV2MutationCacheOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({
      id,
      key,
    }: {
      id: string;
      key: SpeakingV2PromptKey;
    }) =>
      (
        await axiosPrivate.post<SpeakingV2AdminView>(
          speakingV2Endpoints.audio(id, key),
          undefined,
          { timeout: 120_000 },
        )
      ).data,
    onSuccess:
      options.autoCommit === false
        ? undefined
        : (test) => refreshSpeakingCaches(queryClient, test),
  });
};

export const useDeleteSpeakingPromptAudio = (
  options: SpeakingV2MutationCacheOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({
      id,
      key,
    }: {
      id: string;
      key: SpeakingV2PromptKey;
    }) =>
      (
        await axiosPrivate.delete<SpeakingV2AdminView>(
          speakingV2Endpoints.deleteAudio(id, key),
        )
      ).data,
    onSuccess:
      options.autoCommit === false
        ? undefined
        : (test) => refreshSpeakingCaches(queryClient, test),
  });
};

export const usePrepareSpeakingAudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async (id: string) =>
      (
        await axiosPrivate.post<{
          total: number;
          completed: number;
          results: Array<{
            key: SpeakingV2PromptKey;
            ok: boolean;
            message?: string;
          }>;
        }>(speakingV2Endpoints.prepareAudio(id), undefined, {
          timeout: 10 * 60_000,
        })
      ).data,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: speakingV2Keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: speakingV2ListKey });
    },
  });
};

function useSpeakingV2PostAction(
  endpoint: (id: string) => string,
  options: SpeakingV2MutationCacheOptions = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async (id: string) =>
      (
        await axiosPrivate.post<SpeakingV2AdminView>(endpoint(id))
      ).data,
    onSuccess:
      options.autoCommit === false
        ? undefined
        : (test) => refreshSpeakingCaches(queryClient, test),
  });
}

export const usePublishSpeakingV2 = (
  options: SpeakingV2MutationCacheOptions = {},
) => useSpeakingV2PostAction(speakingV2Endpoints.publish, options);

export const useReviseSpeakingV2 = (
  options: SpeakingV2MutationCacheOptions = {},
) => useSpeakingV2PostAction(speakingV2Endpoints.revise, options);

export const useArchiveSpeakingV2 = () =>
  useSpeakingV2PostAction(speakingV2Endpoints.archive);

export const useDeleteSpeakingV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosPrivate.delete(speakingV2Endpoints.delete(id));
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: speakingV2Keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: speakingV2ListKey });
    },
  });
};
