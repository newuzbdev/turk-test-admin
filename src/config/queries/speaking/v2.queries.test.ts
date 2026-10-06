import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { createElement, type PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosPrivate from "@/config/api";
import type {
  SpeakingV2AdminView,
  SpeakingV2UpdateInput,
} from "@/pages/speaking-v2/types";

import {
  speakingV2Endpoints,
  speakingV2Keys,
  speakingV2ListKey,
  isSpeakingEditConflictError,
  useArchiveSpeakingV2,
  useCreateSpeakingV2,
  useDeleteSpeakingPromptAudio,
  useDeleteSpeakingV2,
  useGenerateSpeakingPromptAudio,
  usePrepareSpeakingAudio,
  usePublishSpeakingV2,
  useReviseSpeakingV2,
  useSpeakingV2,
  useUpdateSpeakingV2,
} from "./v2.queries";

vi.mock("@/config/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const wrapperFor = (client: QueryClient) =>
  ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, { client }, children);

const saved = (id = "abc") =>
  ({ id, updatedAt: "2026-08-17T12:10:00.000Z" }) as SpeakingV2AdminView;

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const seedCaches = (client: QueryClient) => {
  client.setQueryData(speakingV2Keys.detail("abc"), saved("old"));
  client.setQueryData(speakingV2ListKey, { data: [saved("old")] });
};

const createAxiosError = (
  status: number,
  responseCode: string,
  code = AxiosError.ERR_BAD_REQUEST,
) => {
  const config = {
    headers: new AxiosHeaders(),
    method: "patch",
    url: "/api/speaking-test/v2/abc",
  };

  return new AxiosError(
    `Request failed with status code ${status}`,
    code,
    config,
    {},
    {
      data: { code: responseCode },
      status,
      statusText: status === 409 ? "Conflict" : "Bad Request",
      headers: new AxiosHeaders(),
      config,
    },
  );
};

describe("speaking v2 queries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses stable cache keys and explicit lifecycle endpoints", () => {
    expect(speakingV2Keys.detail("abc")).toEqual([
      "speaking-v2",
      "detail",
      "abc",
    ]);
    expect(speakingV2Endpoints.publish("abc")).toBe(
      "/api/speaking-test/v2/abc/publish",
    );
    expect(speakingV2Endpoints.audio("abc", "TASK_2_PROMPT")).toBe(
      "/api/speaking-test/v2/abc/audio/TASK_2_PROMPT",
    );
    expect(speakingV2Endpoints.deleteAudio("abc", "TASK_2_PROMPT")).toBe(
      "/api/speaking-test/v2/abc/audio/TASK_2_PROMPT",
    );
  });

  it("stores updated detail and invalidates the speaking list", async () => {
    const client = createClient();
    const next = saved();
    vi.mocked(axiosPrivate.patch).mockResolvedValueOnce({ data: next });
    client.setQueryData(speakingV2ListKey, { data: [] });
    const { result } = renderHook(() => useUpdateSpeakingV2(), {
      wrapper: wrapperFor(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "abc",
        input: { expectedUpdatedAt: "old" } as SpeakingV2UpdateInput,
      });
    });

    expect(client.getQueryData(speakingV2Keys.detail("abc"))).toEqual(next);
    expect(client.getQueryState(speakingV2ListKey)?.isInvalidated).toBe(true);
  });

  it("bounds draft saves so the editor cannot remain pending forever", async () => {
    const client = createClient();
    vi.mocked(axiosPrivate.patch).mockResolvedValueOnce({ data: saved() });
    const { result } = renderHook(() => useUpdateSpeakingV2(), {
      wrapper: wrapperFor(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "abc",
        input: { expectedUpdatedAt: "old" } as SpeakingV2UpdateInput,
      });
    });

    expect(axiosPrivate.patch).toHaveBeenCalledWith(
      "/api/speaking-test/v2/abc",
      { expectedUpdatedAt: "old" },
      { timeout: 20_000 },
    );
  });

  it("allows prompt generation longer than an ordinary draft save", async () => {
    const client = createClient();
    vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: saved() });
    const { result } = renderHook(() => useGenerateSpeakingPromptAudio(), {
      wrapper: wrapperFor(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: "abc", key: "TASK_3_PROMPT" });
    });

    expect(axiosPrivate.post).toHaveBeenCalledWith(
      "/api/speaking-test/v2/abc/audio/TASK_3_PROMPT",
      undefined,
      { timeout: 120_000 },
    );
  });

  it("fetches the V2 detail with GET and stores it under the detail key", async () => {
    const client = createClient();
    const next = saved();
    vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: next });
    const { result } = renderHook(() => useSpeakingV2("abc"), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(axiosPrivate.get).toHaveBeenCalledWith(
      "/api/speaking-test/v2/abc",
    );
    expect(client.getQueryData(speakingV2Keys.detail("abc"))).toEqual(next);
  });

  const lifecycleCases = [
    {
      name: "create",
      request: () =>
        expect(axiosPrivate.post).toHaveBeenCalledWith(
          "/api/speaking-test/v2",
          { title: "Draft", ieltsId: "ielts-1" },
        ),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useCreateSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () =>
          result.current.mutateAsync({ title: "Draft", ieltsId: "ielts-1" });
      },
    },
    {
      name: "update",
      request: () =>
        expect(axiosPrivate.patch).toHaveBeenCalledWith(
          "/api/speaking-test/v2/abc",
          { expectedUpdatedAt: "old" },
          { timeout: 20_000 },
        ),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useUpdateSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () =>
          result.current.mutateAsync({
            id: "abc",
            input: { expectedUpdatedAt: "old" } as SpeakingV2UpdateInput,
          });
      },
    },
    {
      name: "prompt audio",
      request: () =>
        expect(axiosPrivate.post).toHaveBeenCalledWith(
          "/api/speaking-test/v2/abc/audio/TASK_2_PROMPT",
          undefined,
          { timeout: 120_000 },
        ),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useGenerateSpeakingPromptAudio(), {
          wrapper: wrapperFor(client),
        });
        return () =>
          result.current.mutateAsync({ id: "abc", key: "TASK_2_PROMPT" });
      },
    },
    {
      name: "delete prompt audio",
      request: () =>
        expect(axiosPrivate.delete).toHaveBeenCalledWith(
          "/api/speaking-test/v2/abc/audio/TASK_2_PROMPT",
        ),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useDeleteSpeakingPromptAudio(), {
          wrapper: wrapperFor(client),
        });
        return () =>
          result.current.mutateAsync({ id: "abc", key: "TASK_2_PROMPT" });
      },
    },
    {
      name: "publish",
      request: () =>
        expect(axiosPrivate.post).toHaveBeenCalledWith(
          "/api/speaking-test/v2/abc/publish",
        ),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => usePublishSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
    {
      name: "revise",
      request: () =>
        expect(axiosPrivate.post).toHaveBeenCalledWith(
          "/api/speaking-test/v2/abc/revise",
        ),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useReviseSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
    {
      name: "archive",
      request: () =>
        expect(axiosPrivate.post).toHaveBeenCalledWith(
          "/api/speaking-test/v2/abc/archive",
        ),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useArchiveSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
  ];

  it.each(lifecycleCases)(
    "$name uses its lifecycle route and refreshes detail/list caches",
    async ({ request, start }) => {
      const client = createClient();
      const next = saved();
      seedCaches(client);
      vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: next });
      vi.mocked(axiosPrivate.patch).mockResolvedValueOnce({ data: next });
      vi.mocked(axiosPrivate.delete).mockResolvedValueOnce({ data: next });

      const mutate = start(client);
      await act(async () => {
        await mutate();
      });

      request();
      expect(client.getQueryData(speakingV2Keys.detail("abc"))).toEqual(next);
      expect(client.getQueryState(speakingV2ListKey)?.isInvalidated).toBe(true);
    },
  );

  const editorManagedCacheCases = [
    {
      name: "update",
      arrange: () =>
        vi.mocked(axiosPrivate.patch).mockResolvedValueOnce({ data: saved() }),
      start: (client: QueryClient) => {
        const { result } = renderHook(
          () => useUpdateSpeakingV2({ autoCommit: false }),
          { wrapper: wrapperFor(client) },
        );
        return () =>
          result.current.mutateAsync({
            id: "abc",
            input: { expectedUpdatedAt: "old" } as SpeakingV2UpdateInput,
          });
      },
    },
    {
      name: "prompt audio",
      arrange: () =>
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: saved() }),
      start: (client: QueryClient) => {
        const { result } = renderHook(
          () => useGenerateSpeakingPromptAudio({ autoCommit: false }),
          { wrapper: wrapperFor(client) },
        );
        return () =>
          result.current.mutateAsync({ id: "abc", key: "TASK_2_PROMPT" });
      },
    },
    {
      name: "delete prompt audio",
      arrange: () =>
        vi.mocked(axiosPrivate.delete).mockResolvedValueOnce({ data: saved() }),
      start: (client: QueryClient) => {
        const { result } = renderHook(
          () => useDeleteSpeakingPromptAudio({ autoCommit: false }),
          { wrapper: wrapperFor(client) },
        );
        return () =>
          result.current.mutateAsync({ id: "abc", key: "TASK_2_PROMPT" });
      },
    },
    {
      name: "publish",
      arrange: () =>
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: saved() }),
      start: (client: QueryClient) => {
        const { result } = renderHook(
          () => usePublishSpeakingV2({ autoCommit: false }),
          { wrapper: wrapperFor(client) },
        );
        return () => result.current.mutateAsync("abc");
      },
    },
    {
      name: "revise",
      arrange: () =>
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: saved() }),
      start: (client: QueryClient) => {
        const { result } = renderHook(
          () => useReviseSpeakingV2({ autoCommit: false }),
          { wrapper: wrapperFor(client) },
        );
        return () => result.current.mutateAsync("abc");
      },
    },
  ];

  it.each(editorManagedCacheCases)(
    "$name can leave cache commits to an epoch-aware editor",
    async ({ arrange, start }) => {
      const client = createClient();
      const originalDetail = saved("old");
      const originalList = { data: [saved("old")] };
      client.setQueryData(speakingV2Keys.detail("abc"), originalDetail);
      client.setQueryData(speakingV2ListKey, originalList);
      arrange();

      const mutate = start(client);
      await act(async () => {
        await mutate();
      });

      expect(client.getQueryData(speakingV2Keys.detail("abc"))).toEqual(
        originalDetail,
      );
      expect(client.getQueryData(speakingV2ListKey)).toEqual(originalList);
      expect(
        client.getQueryState(speakingV2Keys.detail("abc"))?.isInvalidated,
      ).toBe(false);
      expect(client.getQueryState(speakingV2ListKey)?.isInvalidated).toBe(false);
    },
  );

  it("prepares audio with POST without overwriting the current detail", async () => {
    const client = createClient();
    const original = saved("old");
    client.setQueryData(speakingV2Keys.detail("abc"), original);
    client.setQueryData(speakingV2ListKey, { data: [original] });
    vi.mocked(axiosPrivate.post).mockResolvedValueOnce({
      data: { total: 6, completed: 6, results: [] },
    });
    const { result } = renderHook(() => usePrepareSpeakingAudio(), {
      wrapper: wrapperFor(client),
    });

    await act(async () => {
      await result.current.mutateAsync("abc");
    });

    expect(axiosPrivate.post).toHaveBeenCalledWith(
      "/api/speaking-test/v2/abc/prepare-audio",
      undefined,
      { timeout: 600_000 },
    );
    expect(client.getQueryData(speakingV2Keys.detail("abc"))).toEqual(original);
    expect(client.getQueryState(speakingV2Keys.detail("abc"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(speakingV2ListKey)?.isInvalidated).toBe(true);
  });

  it("deletes with DELETE, removes detail, and invalidates the list", async () => {
    const client = createClient();
    seedCaches(client);
    vi.mocked(axiosPrivate.delete).mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useDeleteSpeakingV2(), {
      wrapper: wrapperFor(client),
    });

    await act(async () => {
      await result.current.mutateAsync("abc");
    });

    expect(axiosPrivate.delete).toHaveBeenCalledWith("/api/speaking-test/v2/abc");
    expect(client.getQueryData(speakingV2Keys.detail("abc"))).toBeUndefined();
    expect(client.getQueryState(speakingV2ListKey)?.isInvalidated).toBe(true);
  });

  const rejectedLifecycleCases = [
    {
      name: "create",
      reject: (error: Error) =>
        vi.mocked(axiosPrivate.post).mockRejectedValueOnce(error),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useCreateSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () =>
          result.current.mutateAsync({ title: "Draft", ieltsId: "ielts-1" });
      },
    },
    {
      name: "prompt audio",
      reject: (error: Error) =>
        vi.mocked(axiosPrivate.post).mockRejectedValueOnce(error),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useGenerateSpeakingPromptAudio(), {
          wrapper: wrapperFor(client),
        });
        return () =>
          result.current.mutateAsync({ id: "abc", key: "TASK_2_PROMPT" });
      },
    },
    {
      name: "prepare audio",
      reject: (error: Error) =>
        vi.mocked(axiosPrivate.post).mockRejectedValueOnce(error),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => usePrepareSpeakingAudio(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
    {
      name: "publish",
      reject: (error: Error) =>
        vi.mocked(axiosPrivate.post).mockRejectedValueOnce(error),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => usePublishSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
    {
      name: "revise",
      reject: (error: Error) =>
        vi.mocked(axiosPrivate.post).mockRejectedValueOnce(error),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useReviseSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
    {
      name: "archive",
      reject: (error: Error) =>
        vi.mocked(axiosPrivate.post).mockRejectedValueOnce(error),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useArchiveSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
    {
      name: "delete",
      reject: (error: Error) =>
        vi.mocked(axiosPrivate.delete).mockRejectedValueOnce(error),
      start: (client: QueryClient) => {
        const { result } = renderHook(() => useDeleteSpeakingV2(), {
          wrapper: wrapperFor(client),
        });
        return () => result.current.mutateAsync("abc");
      },
    },
  ];

  it.each(rejectedLifecycleCases)(
    "propagates $name failures without changing existing caches",
    async ({ reject, start }) => {
      const client = createClient();
      const originalDetail = saved("old");
      const originalList = { data: [saved("old")] };
      const error = new Error("request failed");
      client.setQueryData(speakingV2Keys.detail("abc"), originalDetail);
      client.setQueryData(speakingV2ListKey, originalList);
      reject(error);
      const mutate = start(client);

      await expect(mutate()).rejects.toBe(error);

      expect(client.getQueryData(speakingV2Keys.detail("abc"))).toEqual(originalDetail);
      expect(client.getQueryData(speakingV2ListKey)).toEqual(originalList);
      expect(client.getQueryState(speakingV2Keys.detail("abc"))?.isInvalidated).toBe(false);
      expect(client.getQueryState(speakingV2ListKey)?.isInvalidated).toBe(false);
    },
  );

  it("returns SPEAKING_EDIT_CONFLICT errors without corrupting caches", async () => {
    const client = createClient();
    const originalDetail = saved("old");
    const originalList = { data: [saved("old")] };
    const conflict = createAxiosError(409, "SPEAKING_EDIT_CONFLICT");
    client.setQueryData(speakingV2Keys.detail("abc"), originalDetail);
    client.setQueryData(speakingV2ListKey, originalList);
    vi.mocked(axiosPrivate.patch).mockRejectedValueOnce(conflict);
    const { result } = renderHook(() => useUpdateSpeakingV2(), {
      wrapper: wrapperFor(client),
    });

    await expect(
      result.current.mutateAsync({
        id: "abc",
        input: { expectedUpdatedAt: "old" } as SpeakingV2UpdateInput,
      }),
    ).rejects.toBe(conflict);

    expect(isSpeakingEditConflictError(conflict)).toBe(true);
    expect(client.getQueryData(speakingV2Keys.detail("abc"))).toEqual(originalDetail);
    expect(client.getQueryData(speakingV2ListKey)).toEqual(originalList);
    expect(client.getQueryState(speakingV2Keys.detail("abc"))?.isInvalidated).toBe(false);
    expect(client.getQueryState(speakingV2ListKey)?.isInvalidated).toBe(false);
  });

  it("does not recognize the conflict payload with the wrong HTTP status", () => {
    expect(
      isSpeakingEditConflictError(
        createAxiosError(400, "SPEAKING_EDIT_CONFLICT"),
      ),
    ).toBe(false);
  });

  it("does not trust a transport-only top-level conflict code", () => {
    const config = {
      headers: new AxiosHeaders(),
      method: "patch",
      url: "/api/speaking-test/v2/abc",
    };
    const error = new AxiosError(
      "Network Error",
      "SPEAKING_EDIT_CONFLICT",
      config,
    );

    expect(isSpeakingEditConflictError(error)).toBe(false);
  });
});
