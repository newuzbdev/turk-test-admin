import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { message } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { SpeakingV2AdminView } from "./types";
import { SpeakingEditorPageV2 } from "./speaking-editor-page-v2";

const mutations = vi.hoisted(() => ({
  save: vi.fn(),
  publish: vi.fn(),
  checkPublication: vi.fn(),
  generate: vi.fn(),
  deleteAudio: vi.fn(),
  upload: vi.fn(),
  revise: vi.fn(),
}));
const queryState = vi.hoisted(() => ({
  view: null as unknown as SpeakingV2AdminView,
  refetch: vi.fn(),
}));

const question = (
  id: string,
  text: string,
  preparationSeconds: number,
  responseSeconds: number,
) => ({ id, text, preparationSeconds, responseSeconds });

const editorFixture = {
  id: "test-v2",
  title: "Konuşma Denemesi",
  ieltsId: "package-1",
  formatVersion: 2,
  status: "DRAFT",
  publishedAt: null,
  updatedAt: "2026-08-17T12:00:00.000Z",
  submissionCount: 0,
  activeAttemptCount: 0,
  tasks: {
    TASK_1_1: {
      questions: [
        question("11-1", "Kendinizi tanıtın.", 0, 30),
        question("11-2", "Nerede yaşıyorsunuz?", 0, 30),
        question("11-3", "Boş zamanınızda ne yaparsınız?", 0, 30),
      ],
    },
    TASK_1_2: {
      images: ["image-a", "image-b"],
      visualContext: {
        verified: true,
        descriptions: [
          { imageUrl: "image-a", description: "Birinci görsel" },
          { imageUrl: "image-b", description: "İkinci görsel" },
        ],
      },
      questions: [
        question("12-1", "Görselleri karşılaştırın.", 0, 30),
        question("12-2", "Hangisini seçersiniz?", 0, 30),
        question("12-3", "Neden?", 0, 30),
      ],
    },
    TASK_2: {
      images: ["image-c"],
      visualContext: {
        verified: true,
        descriptions: [
          { imageUrl: "image-c", description: "Konuşma görseli" },
        ],
      },
      questions: [
        question("2-1", "Görseli anlatın.", 60, 120),
        question("2-2", "Bu durum neden önemlidir?", 60, 120),
        question("2-3", "Bir örnek verin.", 60, 120),
      ],
    },
    TASK_3: {
      statement: "Teknoloji insanları yakınlaştırır.",
      advantages: ["İletişim", "Erişim", "Hız"],
      disadvantages: ["Bağımlılık", "Gizlilik", "Yalnızlık"],
    },
  },
  audioItems: [],
  readiness: { ready: true, issues: [] },
} as SpeakingV2AdminView;

const speakingConflict = () => ({
  response: { status: 409, data: { code: "SPEAKING_EDIT_CONFLICT" } },
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

vi.mock("@/config/queries/speaking/v2.queries", () => ({
  checkSpeakingV2Publication: mutations.checkPublication,
  speakingV2Keys: { detail: (id: string) => ["speaking-v2", "detail", id] },
  speakingV2ListKey: ["speaking-v2-list"],
  useSpeakingV2: () => ({
    data: queryState.view,
    isLoading: false,
    refetch: queryState.refetch,
  }),
  useUpdateSpeakingV2: () => ({ mutateAsync: mutations.save, isPending: false }),
  usePublishSpeakingV2: () => ({
    mutateAsync: mutations.publish,
    isPending: false,
  }),
  useGenerateSpeakingPromptAudio: () => ({
    mutateAsync: mutations.generate,
    isPending: false,
  }),
  useDeleteSpeakingPromptAudio: () => ({
    mutateAsync: mutations.deleteAudio,
    isPending: false,
  }),
  useReviseSpeakingV2: () => ({
    mutateAsync: mutations.revise,
    isPending: false,
  }),
}));

vi.mock("@/config/queries/ielts/get-all.queries", () => ({
  useGetAllIelts: () => ({
    data: { ieltsData: [{ id: "package-1", title: "Paket 1" }] },
    isLoading: false,
  }),
}));

vi.mock("./speaking-v2-file.queries", () => ({
  createFileAccessUrl: vi.fn().mockResolvedValue("/preview/image"),
  createBrowserMediaPreviewUrl: vi
    .fn()
    .mockImplementation(async (url: string) => url),
  useSpeakingV2FileUpload: () => ({
    mutateAsync: mutations.upload,
    isPending: false,
  }),
}));

const renderEditor = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(
    ["speaking-v2", "detail", "test-v2"],
    queryState.view,
  );

  const EditorApp = () => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/speaking/test-v2/edit"]}>
        <Routes>
          <Route
            path="/speaking/:id/edit"
            element={<SpeakingEditorPageV2 />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  const rendered = render(<EditorApp />);

  return {
    ...rendered,
    queryClient,
    refresh: () => rendered.rerender(<EditorApp />),
  };
};

describe("SpeakingEditorPageV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState.view = editorFixture;
    mutations.save.mockResolvedValue(editorFixture);
    mutations.checkPublication.mockResolvedValue({ available: true });
    mutations.publish.mockResolvedValue({
      ...editorFixture,
      status: "PUBLISHED",
    });
    mutations.generate.mockResolvedValue(editorFixture);
    mutations.deleteAudio.mockResolvedValue(editorFixture);
    mutations.upload.mockResolvedValue({ data: { reference: "new-image" } });
    mutations.revise.mockResolvedValue(editorFixture);
    queryState.refetch.mockImplementation(async () => ({
      data: queryState.view,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the exact fixed shape and timing for all four stages", async () => {
    const user = userEvent.setup();
    renderEditor();

    expect(screen.getAllByLabelText(/^Soru [1-3]$/)).toHaveLength(3);
    expect(screen.getAllByText("30 sn")).toHaveLength(3);
    expect(screen.queryByText("60 sn hazırlık · 120 sn cevap")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Bölüm 1\.2/ }));
    expect(screen.getAllByRole("button", { name: "Değiştir" })).toHaveLength(2);
    expect(screen.getAllByLabelText(/^Soru [1-3]$/)).toHaveLength(3);
    expect(screen.getAllByText("30 sn")).toHaveLength(3);

    await user.click(screen.getByRole("tab", { name: /Bölüm 2/ }));
    expect(screen.getAllByRole("button", { name: "Değiştir" })).toHaveLength(1);
    expect(screen.getAllByLabelText(/^Soru [1-3]$/)).toHaveLength(3);
    expect(screen.getByText("60 sn hazırlık · 120 sn cevap")).toBeInTheDocument();
    expect(screen.queryByText("30 sn")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Bölüm 3/ }));
    expect(screen.getByLabelText("Tartışma ifadesi")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Lehine madde/)).toHaveLength(3);
    expect(screen.getAllByLabelText(/^Aleyhine madde/)).toHaveLength(3);
    expect(screen.getByText("60 sn hazırlık · 120 sn cevap")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Soru [1-3]$/)).not.toBeInTheDocument();
  });

  it("never exposes structural or duration controls on any stage", async () => {
    const user = userEvent.setup();
    renderEditor();

    for (const label of ["Bölüm 1.1", "Bölüm 1.2", "Bölüm 2", "Bölüm 3"]) {
      await user.click(screen.getByRole("tab", { name: new RegExp(label) }));
      expect(
        screen.queryByRole("button", {
          name: /ekle|sil|yukarı|aşağı|taşı|süre/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    }
  });

  it("focuses the stage returned by a publication issue", async () => {
    const user = userEvent.setup();
    mutations.publish.mockRejectedValueOnce({
      response: {
        data: {
          issues: [
            {
              taskCode: "TASK_2",
              field: "images",
              message: "Bir görsel ekleyin.",
            },
          ],
        },
      },
    });
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(screen.getByRole("tab", { name: /Bölüm 2/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Bir görsel ekleyin.")).toBeInTheDocument();
  });

  it("shows the existing published test before spending on audio for a duplicate", async () => {
    const user = userEvent.setup();
    const blockedDraft = {
      ...editorFixture,
      audioItems: [{ key: "TASK_1_1_Q1", taskCode: "TASK_1_1", status: "MISSING", audioObjectKey: null, previewUrl: null, generatedAt: null, error: null }],
    } as SpeakingV2AdminView;
    queryState.view = blockedDraft;
    mutations.save.mockResolvedValue(blockedDraft);
    mutations.checkPublication.mockRejectedValueOnce({
      response: { status: 409, data: { issues: [{ taskCode: "TEST", field: "ieltsId", message: "Bu denemede Konuşma A zaten yayında. Önce onu arşivleyin." }] } },
    });
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(await screen.findByText("Bu denemede Konuşma A zaten yayında. Önce onu arşivleyin.")).toBeInTheDocument();
    expect(mutations.generate).not.toHaveBeenCalled();
    expect(mutations.publish).not.toHaveBeenCalled();
  });

  it("prepares only the six required question audios before publishing", async () => {
    const user = userEvent.setup();
    const keys = [
      "TASK_1_1_Q1",
      "TASK_1_1_Q2",
      "TASK_1_1_Q3",
      "TASK_1_2_Q1",
      "TASK_1_2_Q2",
      "TASK_1_2_Q3",
      "TASK_2_PROMPT",
      "TASK_3_PROMPT",
    ] as const;
    const withMissingAudio = {
      ...editorFixture,
      audioItems: keys.map((key) => ({
        key,
        taskCode: key.startsWith("TASK_1_1")
          ? "TASK_1_1"
          : key.startsWith("TASK_1_2")
            ? "TASK_1_2"
            : key.startsWith("TASK_2")
              ? "TASK_2"
              : "TASK_3",
        status: "MISSING" as const,
        audioObjectKey: null,
        previewUrl: null,
        generatedAt: null,
        error: null,
      })),
    } as SpeakingV2AdminView;
    queryState.view = withMissingAudio;
    mutations.save.mockResolvedValueOnce(withMissingAudio);
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(await screen.findByText("Hazırlanan ses: 6/6")).toBeInTheDocument();
    expect(mutations.generate).toHaveBeenCalledTimes(6);
    expect(mutations.generate).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "TASK_2_PROMPT" }),
    );
    expect(mutations.generate).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "TASK_3_PROMPT" }),
    );
    expect(mutations.publish).toHaveBeenCalledWith("test-v2");
  });

  it("does not generate audio until the saved draft has no content issues", async () => {
    const user = userEvent.setup();
    const incompleteDraft = {
      ...editorFixture,
      readiness: {
        ready: false,
        issues: [
          {
            taskCode: "TASK_1_2" as const,
            field: "images",
            message: "2 görsel bulunmalı.",
          },
        ],
      },
      audioItems: [
        {
          key: "TASK_1_2_Q1" as const,
          taskCode: "TASK_1_2" as const,
          status: "MISSING" as const,
          audioObjectKey: null,
          previewUrl: null,
          generatedAt: null,
          error: null,
        },
      ],
    } as SpeakingV2AdminView;
    queryState.view = incompleteDraft;
    mutations.save.mockResolvedValueOnce(incompleteDraft);
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(await screen.findByText("2 görsel bulunmalı.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Bölüm 1\.2/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(mutations.generate).not.toHaveBeenCalled();
    expect(mutations.publish).not.toHaveBeenCalled();
  });

  it("stops publication and focuses the task whose required prompt audio failed", async () => {
    const user = userEvent.setup();
    const withMissingTaskTwoAudio = {
      ...editorFixture,
      audioItems: [
        {
          key: "TASK_1_1_Q1" as const,
          taskCode: "TASK_1_1" as const,
          status: "MISSING" as const,
          audioObjectKey: null,
          previewUrl: null,
          generatedAt: null,
          error: null,
        },
      ],
    } as SpeakingV2AdminView;
    queryState.view = withMissingTaskTwoAudio;
    mutations.save.mockResolvedValueOnce(withMissingTaskTwoAudio);
    mutations.generate.mockRejectedValueOnce(new Error("TTS unavailable"));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(
      await screen.findByText(
        "Soru sesi hazırlanamadı. Bu görevde yeniden deneyin.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Bölüm 1\.1/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(mutations.publish).not.toHaveBeenCalled();
  });

  it("saves the visible draft before retrying one prompt audio", async () => {
    const user = userEvent.setup();
    const withStaleAudio = {
      ...editorFixture,
      audioItems: [
        {
          key: "TASK_1_1_Q1" as const,
          taskCode: "TASK_1_1" as const,
          status: "STALE" as const,
          audioObjectKey: "pmr.v1.old-audio",
          previewUrl: "/preview/old-audio",
          generatedAt: "2026-08-17T12:00:00.000Z",
          error: null,
        },
      ],
    } as SpeakingV2AdminView;
    queryState.view = withStaleAudio;
    mutations.save.mockResolvedValueOnce(withStaleAudio);
    renderEditor();

    await user.click(
      screen.getByRole("button", { name: "Sesi yeniden hazırla" }),
    );

    expect(mutations.save).toHaveBeenCalledTimes(1);
    expect(mutations.generate).toHaveBeenCalledWith({
      id: "test-v2",
      key: "TASK_1_1_Q1",
    });
    expect(mutations.save.mock.invocationCallOrder[0]).toBeLessThan(
      mutations.generate.mock.invocationCallOrder[0],
    );
  });

  it("saves the draft before deleting an optional prompt audio", async () => {
    const user = userEvent.setup();
    const readyOptionalAudio = {
      ...editorFixture,
      audioItems: [
        {
          key: "TASK_2_PROMPT" as const,
          taskCode: "TASK_2" as const,
          status: "READY" as const,
          audioObjectKey: "pmr.v1.task-2-audio",
          previewUrl: "/preview/task-2-audio",
          generatedAt: "2026-08-17T12:00:00.000Z",
          error: null,
        },
      ],
    } as SpeakingV2AdminView;
    const deletedOptionalAudio = {
      ...readyOptionalAudio,
      audioItems: [
        {
          ...readyOptionalAudio.audioItems[0],
          status: "MISSING" as const,
          audioObjectKey: null,
          previewUrl: null,
          generatedAt: null,
        },
      ],
    } as SpeakingV2AdminView;
    queryState.view = readyOptionalAudio;
    mutations.save.mockResolvedValueOnce(readyOptionalAudio);
    mutations.deleteAudio.mockResolvedValueOnce(deletedOptionalAudio);
    renderEditor();

    await user.click(screen.getByRole("tab", { name: /Bölüm 2/ }));
    await user.click(
      screen.getByRole("button", { name: "Bölüm 2 sesini sil" }),
    );

    expect(mutations.save).toHaveBeenCalledTimes(1);
    expect(mutations.deleteAudio).toHaveBeenCalledWith({
      id: "test-v2",
      key: "TASK_2_PROMPT",
    });
    expect(
      await screen.findByText("İsteğe bağlı · Hazır değil"),
    ).toBeInTheDocument();
  });

  it("saves repeatedly on the same draft instead of creating duplicate rows", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));

    expect(mutations.save).toHaveBeenCalledTimes(2);
    expect(
      mutations.save.mock.calls.every(([payload]) => payload.id === "test-v2"),
    ).toBe(true);
  });

  it("creates a new draft revision from a published test with submissions", async () => {
    const user = userEvent.setup();
    queryState.view = {
      ...editorFixture,
      status: "PUBLISHED",
      submissionCount: 1,
    };
    mutations.revise.mockResolvedValueOnce({
      ...editorFixture,
      id: "revision-v2",
    });
    renderEditor();

    await user.click(
      screen.getByRole("button", { name: "Yeni sürüm oluştur" }),
    );

    expect(mutations.revise).toHaveBeenCalledWith("test-v2");
  });

  it("locks a published test with an active attempt and explains the revision flow", () => {
    queryState.view = {
      ...editorFixture,
      status: "PUBLISHED",
      activeAttemptCount: 1,
    };

    renderEditor();

    expect(
      screen.getByText(
        "Bu sınavda devam eden bir öğrenci oturumu var. Mevcut sınav korunur; değişiklik yapmak için yeni sürüm oluşturun.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yeni sürüm oluştur" }),
    ).toBeInTheDocument();
  });

  it("starts only one revision when the action is clicked twice rapidly", async () => {
    const revision = deferred<SpeakingV2AdminView>();
    queryState.view = {
      ...editorFixture,
      status: "PUBLISHED",
      submissionCount: 1,
    };
    mutations.revise.mockReturnValueOnce(revision.promise);
    renderEditor();
    const reviseButton = screen.getByRole("button", {
      name: "Yeni sürüm oluştur",
    });

    fireEvent.click(reviseButton);
    fireEvent.click(reviseButton);

    expect(mutations.revise).toHaveBeenCalledTimes(1);
    expect(reviseButton).toBeDisabled();

    await act(async () => {
      revision.resolve({ ...editorFixture, id: "revision-v2" });
      await revision.promise;
    });
  });

  it("handles revision rejection and re-enables the action", async () => {
    const user = userEvent.setup();
    const errorMessage = vi
      .spyOn(message, "error")
      .mockImplementation(() => undefined as never);
    queryState.view = {
      ...editorFixture,
      status: "PUBLISHED",
      submissionCount: 1,
    };
    mutations.revise.mockRejectedValueOnce(new Error("revision failed"));
    renderEditor();
    const reviseButton = screen.getByRole("button", {
      name: "Yeni sürüm oluştur",
    });

    await user.click(reviseButton);

    expect(errorMessage).toHaveBeenCalledWith(
      "Yeni sürüm oluşturulamadı. Yeniden deneyin.",
    );
    expect(reviseButton).toBeEnabled();
    expect(mutations.revise).toHaveBeenCalledTimes(1);
  });

  it("offers the latest draft after an optimistic edit conflict", async () => {
    const user = userEvent.setup();
    mutations.save.mockRejectedValueOnce({
      response: { status: 409, data: { code: "SPEAKING_EDIT_CONFLICT" } },
    });
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));

    expect(await screen.findByText("Daha yeni bir sürüm var")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Son sürümü aç" }),
    ).toBeInTheDocument();
  });

  it("waits the full 600 ms debounce window before autosaving", async () => {
    vi.useFakeTimers();
    renderEditor();

    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), {
      target: { value: "Yeni başlık" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(599);
    });
    expect(mutations.save).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mutations.save).toHaveBeenCalledTimes(1);
  });

  it("keeps the original base token so a newer dirty refetch conflicts", async () => {
    const user = userEvent.setup();
    const latestServerDraft = {
      ...editorFixture,
      title: "Diğer sekmedeki sürüm",
      updatedAt: "2026-08-17T12:05:00.000Z",
    } as SpeakingV2AdminView;
    mutations.save.mockImplementationOnce(({ input }) =>
      input.expectedUpdatedAt === editorFixture.updatedAt
        ? Promise.reject({
            response: {
              status: 409,
              data: { code: "SPEAKING_EDIT_CONFLICT" },
            },
          })
        : Promise.resolve({ ...latestServerDraft, title: input.title }),
    );
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    await user.clear(title);
    await user.type(title, "Yerel sürüm");
    queryState.view = latestServerDraft;
    editor.refresh();
    expect(title).toHaveValue("Yerel sürüm");

    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));

    expect(await screen.findByText("Daha yeni bir sürüm var")).toBeInTheDocument();
    expect(mutations.save).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          expectedUpdatedAt: "2026-08-17T12:00:00.000Z",
        }),
      }),
    );
  });

  it("awaits a fresh server read before discarding to the exact latest draft", async () => {
    const user = userEvent.setup();
    let resolveFresh:
      | ((value: { data: SpeakingV2AdminView }) => void)
      | undefined;
    const staleCachedDraft = {
      ...editorFixture,
      title: "Önbellekteki eski sürüm",
      updatedAt: "2026-08-17T12:05:00.000Z",
    } as SpeakingV2AdminView;
    const freshServerDraft = {
      ...editorFixture,
      title: "Sunucudan yeni okunan sürüm",
      updatedAt: "2026-08-17T12:10:00.000Z",
    } as SpeakingV2AdminView;
    mutations.save
      .mockRejectedValueOnce({
        response: { status: 409, data: { code: "SPEAKING_EDIT_CONFLICT" } },
      })
      .mockImplementationOnce(({ input }) =>
        Promise.resolve({ ...freshServerDraft, title: input.title }),
      );
    queryState.refetch.mockImplementationOnce(
      () =>
        new Promise<{ data: SpeakingV2AdminView }>((resolve) => {
          resolveFresh = resolve;
        }),
    );
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    await user.clear(title);
    await user.type(title, "Atılacak yerel sürüm");
    queryState.view = staleCachedDraft;
    editor.refresh();
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await user.click(await screen.findByRole("button", { name: "Son sürümü aç" }));
    await waitFor(() => expect(queryState.refetch).toHaveBeenCalledTimes(1));
    const titleWhileFetching = title.getAttribute("value");

    await act(async () => {
      resolveFresh?.({ data: freshServerDraft });
    });

    expect(titleWhileFetching).toBe("Atılacak yerel sürüm");
    expect(title).toHaveValue("Sunucudan yeni okunan sürüm");
    expect(screen.getByRole("status")).toHaveTextContent("Sunucudaki sürüm açıldı");
    expect(
      editor.queryClient.getQueryData([
        "speaking-v2",
        "detail",
        "test-v2",
      ]),
    ).toEqual(freshServerDraft);

    await user.clear(title);
    await user.type(title, "Yeni tabandan düzenleme");
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(mutations.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          expectedUpdatedAt: "2026-08-17T12:10:00.000Z",
        }),
      }),
    );
  });

  it("ignores a pending save success after opening the fresh server draft", async () => {
    const user = userEvent.setup();
    const oldSave = deferred<SpeakingV2AdminView>();
    const freshServerDraft = {
      ...editorFixture,
      title: "Sunucudaki temiz sürüm",
      updatedAt: "2026-08-17T12:10:00.000Z",
    } as SpeakingV2AdminView;
    mutations.save
      .mockRejectedValueOnce(speakingConflict())
      .mockReturnValueOnce(oldSave.promise);
    queryState.refetch.mockResolvedValueOnce({ data: freshServerDraft });
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    fireEvent.change(title, { target: { value: "Eski yerel düzenleme" } });
    queryState.view = freshServerDraft;
    editor.refresh();
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await screen.findByText("Daha yeni bir sürüm var");
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(mutations.save).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Son sürümü aç" }));
    await waitFor(() =>
      expect(title).toHaveValue("Sunucudaki temiz sürüm"),
    );

    await act(async () => {
      oldSave.resolve({
        ...editorFixture,
        title: "Gecikmiş eski kayıt yanıtı",
        updatedAt: "2026-08-17T12:20:00.000Z",
      });
      await oldSave.promise;
    });

    expect(title).toHaveValue("Sunucudaki temiz sürüm");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sunucudaki sürüm açıldı",
    );
    expect(
      editor.queryClient.getQueryData([
        "speaking-v2",
        "detail",
        "test-v2",
      ]),
    ).toEqual(freshServerDraft);
  });

  it("does not reopen a conflict from a save rejected after discard", async () => {
    const user = userEvent.setup();
    const oldSave = deferred<SpeakingV2AdminView>();
    const freshServerDraft = {
      ...editorFixture,
      title: "Yeni sunucu sürümü",
      updatedAt: "2026-08-17T12:10:00.000Z",
    } as SpeakingV2AdminView;
    mutations.save
      .mockRejectedValueOnce(speakingConflict())
      .mockReturnValueOnce(oldSave.promise);
    queryState.refetch.mockResolvedValueOnce({ data: freshServerDraft });
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    fireEvent.change(title, { target: { value: "Çakışacak yerel sürüm" } });
    queryState.view = freshServerDraft;
    editor.refresh();
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await screen.findByText("Daha yeni bir sürüm var");
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(mutations.save).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Son sürümü aç" }));
    await waitFor(() =>
      expect(title).toHaveValue("Yeni sunucu sürümü"),
    );

    await act(async () => {
      oldSave.reject(speakingConflict());
      await oldSave.promise.catch(() => undefined);
    });

    expect(
      screen.queryByRole("dialog", { name: "Daha yeni bir sürüm var" }),
    ).not.toBeInTheDocument();
    expect(title).toHaveValue("Yeni sunucu sürümü");
    expect(
      editor.queryClient.getQueryData([
        "speaking-v2",
        "detail",
        "test-v2",
      ]),
    ).toEqual(freshServerDraft);
  });

  it("autosaves a dirty draft and retains it when a refetch arrives", async () => {
    const user = userEvent.setup();
    mutations.save.mockImplementation(async ({ input }) => ({
      ...editorFixture,
      title: input.title,
      updatedAt: "2026-08-17T12:01:00.000Z",
    }));
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    await user.clear(title);
    await user.type(title, "Yerel taslak");
    queryState.view = { ...editorFixture, title: "Uzaktaki taslak" };
    editor.refresh();

    expect(title).toHaveValue("Yerel taslak");
    await waitFor(
      () =>
        expect(mutations.save).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "test-v2",
            input: expect.objectContaining({ title: "Yerel taslak" }),
          }),
        ),
      { timeout: 1500 },
    );
  });

  it("does not repeatedly autosave the same version after a failed request", async () => {
    mutations.save.mockRejectedValue(new Error("save failed"));
    renderEditor();

    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), {
      target: { value: "Kaydı başarısız taslak" },
    });

    await waitFor(() => expect(mutations.save).toHaveBeenCalledTimes(1), {
      timeout: 1500,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 1400));

    expect(mutations.save).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Taslak kaydedilemedi",
    );
  });

  it("rejects an older same-epoch save without replacing cache or clearing dirty state", async () => {
    const user = userEvent.setup();
    const save = deferred<SpeakingV2AdminView>();
    mutations.save.mockReturnValueOnce(save.promise);
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    fireEvent.change(title, { target: { value: "Yerel değişiklik" } });
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(mutations.save).toHaveBeenCalledTimes(1));

    const newerServerDraft = {
      ...editorFixture,
      title: "Daha yeni sunucu sürümü",
      updatedAt: "2026-08-17T12:10:00.000Z",
    } as SpeakingV2AdminView;
    queryState.view = newerServerDraft;
    editor.queryClient.setQueryData(
      ["speaking-v2", "detail", "test-v2"],
      newerServerDraft,
    );
    editor.refresh();

    await act(async () => {
      save.resolve({
        ...editorFixture,
        title: "Gecikmiş kayıt yanıtı",
        updatedAt: "2026-08-17T12:05:00.000Z",
      });
      await save.promise;
    });

    expect(title).toHaveValue("Yerel değişiklik");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Kaydedilmemiş değişiklikler",
    );
    expect(
      editor.queryClient.getQueryData([
        "speaking-v2",
        "detail",
        "test-v2",
      ]),
    ).toEqual(newerServerDraft);
  });

  it("preserves the local draft and dirty guard when latest refetch fails", async () => {
    const user = userEvent.setup();
    mutations.save.mockRejectedValueOnce(speakingConflict());
    queryState.refetch.mockRejectedValueOnce(new Error("refetch failed"));
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    fireEvent.change(title, { target: { value: "Korunacak yerel taslak" } });
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await user.click(await screen.findByRole("button", { name: "Son sürümü aç" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Son sunucu sürümü alınamadı",
      ),
    );
    expect(title).toHaveValue("Korunacak yerel taslak");
    expect(
      editor.queryClient.getQueryData([
        "speaking-v2",
        "detail",
        "test-v2",
      ]),
    ).toEqual(editorFixture);
    const beforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
  });

  it("keeps edits made while a save is in flight", async () => {
    const user = userEvent.setup();
    let resolveSave: ((value: SpeakingV2AdminView) => void) | undefined;
    mutations.save.mockImplementationOnce(
      () =>
        new Promise<SpeakingV2AdminView>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    await user.clear(title);
    await user.type(title, "İlk sürüm");
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await user.clear(title);
    await user.type(title, "Daha yeni yerel sürüm");
    resolveSave?.({
      ...editorFixture,
      title: "İlk sürüm",
      updatedAt: "2026-08-17T12:01:00.000Z",
    });

    await waitFor(() => expect(title).toHaveValue("Daha yeni yerel sürüm"));
  });

  it("keeps edits made while prompt audio generation is in flight", async () => {
    const user = userEvent.setup();
    let resolveGeneration: ((value: SpeakingV2AdminView) => void) | undefined;
    const withStaleAudio = {
      ...editorFixture,
      audioItems: [
        {
          key: "TASK_1_1_Q1" as const,
          taskCode: "TASK_1_1" as const,
          status: "STALE" as const,
          audioObjectKey: "pmr.v1.old-audio",
          previewUrl: "/preview/old-audio",
          generatedAt: "2026-08-17T12:00:00.000Z",
          error: null,
        },
      ],
    } as SpeakingV2AdminView;
    queryState.view = withStaleAudio;
    mutations.save.mockResolvedValueOnce(withStaleAudio);
    mutations.generate.mockImplementationOnce(
      () =>
        new Promise<SpeakingV2AdminView>((resolve) => {
          resolveGeneration = resolve;
        }),
    );
    renderEditor();

    await user.click(
      screen.getByRole("button", { name: "Sesi yeniden hazırla" }),
    );
    await waitFor(() => expect(mutations.generate).toHaveBeenCalledTimes(1));
    const title = screen.getByRole("textbox", { name: "Test adı" });
    await user.clear(title);
    await user.type(title, "TTS sürerken yeni metin");

    await act(async () => {
      resolveGeneration?.({
        ...withStaleAudio,
        title: "Eski TTS yanıtı",
        updatedAt: "2026-08-17T12:01:00.000Z",
      });
    });

    expect(title).toHaveValue("TTS sürerken yeni metin");
  });

  it("ignores an audio completion from before the fresh draft was opened", async () => {
    const user = userEvent.setup();
    const generation = deferred<SpeakingV2AdminView>();
    const staleAudio = {
      key: "TASK_1_1_Q1" as const,
      taskCode: "TASK_1_1" as const,
      status: "STALE" as const,
      audioObjectKey: "pmr.v1.stale-audio",
      previewUrl: "/preview/stale-audio",
      generatedAt: "2026-08-17T12:00:00.000Z",
      error: null,
    };
    const withStaleAudio = {
      ...editorFixture,
      audioItems: [staleAudio],
    } as SpeakingV2AdminView;
    const freshServerDraft = {
      ...editorFixture,
      title: "Sesli yeni sunucu sürümü",
      updatedAt: "2026-08-17T12:10:00.000Z",
      audioItems: [
        {
          ...staleAudio,
          status: "READY" as const,
          audioObjectKey: "pmr.v1.fresh-audio",
          previewUrl: "/preview/fresh-audio",
          generatedAt: "2026-08-17T12:10:00.000Z",
        },
      ],
    } as SpeakingV2AdminView;
    queryState.view = withStaleAudio;
    mutations.save
      .mockResolvedValueOnce(withStaleAudio)
      .mockRejectedValueOnce(speakingConflict());
    mutations.generate.mockReturnValueOnce(generation.promise);
    queryState.refetch.mockResolvedValueOnce({ data: freshServerDraft });
    const editor = renderEditor();

    await user.click(
      screen.getByRole("button", { name: "Sesi yeniden hazırla" }),
    );
    await waitFor(() => expect(mutations.generate).toHaveBeenCalledTimes(1));
    const title = screen.getByRole("textbox", { name: "Test adı" });
    fireEvent.change(title, {
      target: { value: "Ses sürerken eski yerel değişiklik" },
    });
    queryState.view = freshServerDraft;
    editor.refresh();
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await screen.findByText("Daha yeni bir sürüm var");
    await user.click(screen.getByRole("button", { name: "Son sürümü aç" }));
    await waitFor(() =>
      expect(title).toHaveValue("Sesli yeni sunucu sürümü"),
    );

    await act(async () => {
      generation.resolve({
        ...withStaleAudio,
        title: "Gecikmiş eski ses yanıtı",
        updatedAt: "2026-08-17T12:20:00.000Z",
        audioItems: [
          {
            ...staleAudio,
            status: "READY",
            audioObjectKey: "pmr.v1.old-completion",
            previewUrl: "/preview/old-completion",
            generatedAt: "2026-08-17T12:20:00.000Z",
          },
        ],
      });
      await generation.promise;
    });

    expect(title).toHaveValue("Sesli yeni sunucu sürümü");
    expect(
      screen.getByLabelText("Bölüm 1.1 · Soru 1 ses önizlemesi"),
    ).toHaveAttribute("src", "/preview/fresh-audio");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sunucudaki sürüm açıldı",
    );
    expect(
      editor.queryClient.getQueryData([
        "speaking-v2",
        "detail",
        "test-v2",
      ]),
    ).toEqual(freshServerDraft);
  });

  it("awaits an in-flight image upload and saves its result before publishing", async () => {
    const user = userEvent.setup();
    let resolveUpload: ((value: { data: { reference: string } }) => void) | undefined;
    mutations.upload.mockImplementationOnce(
      () =>
        new Promise<{ data: { reference: string } }>((resolve) => {
          resolveUpload = resolve;
        }),
    );
    mutations.save.mockImplementationOnce(({ input }) =>
      Promise.resolve({
        ...editorFixture,
        updatedAt: "2026-08-17T12:01:00.000Z",
        tasks: {
          ...editorFixture.tasks,
          TASK_1_2: {
            ...editorFixture.tasks.TASK_1_2,
            images: input.tasks.TASK_1_2.images,
            visualContext: input.tasks.TASK_1_2.visualContext,
          },
        },
      }),
    );
    const editor = renderEditor();

    await user.click(screen.getByRole("tab", { name: /Bölüm 1\.2/ }));
    const fileInput = editor.container.querySelector<HTMLInputElement>(
      ".ant-upload input[type=file]",
    );
    expect(fileInput).not.toBeNull();
    await user.upload(fileInput!, new File(["image"], "new-image.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    const savesBeforeUploadCompleted = mutations.save.mock.calls.length;

    await act(async () => {
      resolveUpload?.({ data: { reference: "uploaded-image" } });
    });

    expect(savesBeforeUploadCompleted).toBe(0);
    await waitFor(() => expect(mutations.publish).toHaveBeenCalledWith("test-v2"));
    expect(mutations.save).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          tasks: expect.objectContaining({
            TASK_1_2: expect.objectContaining({
              images: ["uploaded-image", "image-b"],
            }),
          }),
        }),
      }),
    );
    expect(mutations.upload.mock.invocationCallOrder[0]).toBeLessThan(
      mutations.save.mock.invocationCallOrder[0],
    );
    expect(mutations.save.mock.invocationCallOrder[0]).toBeLessThan(
      mutations.publish.mock.invocationCallOrder[0],
    );
  });

  it("ignores an image upload completion from before the fresh draft was opened", async () => {
    const user = userEvent.setup();
    const upload = deferred<{ data: { reference: string } }>();
    const freshServerDraft = {
      ...editorFixture,
      title: "Görselli yeni sunucu sürümü",
      updatedAt: "2026-08-17T12:10:00.000Z",
      tasks: {
        ...editorFixture.tasks,
        TASK_1_2: {
          ...editorFixture.tasks.TASK_1_2,
          images: ["fresh-image-a", "fresh-image-b"],
          visualContext: {
            verified: true,
            descriptions: [
              { imageUrl: "fresh-image-a", description: "Yeni birinci görsel" },
              { imageUrl: "fresh-image-b", description: "Yeni ikinci görsel" },
            ],
          },
        },
      },
    } as SpeakingV2AdminView;
    mutations.upload.mockReturnValueOnce(upload.promise);
    mutations.save
      .mockRejectedValueOnce(speakingConflict())
      .mockImplementationOnce(({ input }) =>
        Promise.resolve({
          ...freshServerDraft,
          title: input.title,
          tasks: {
            ...freshServerDraft.tasks,
            TASK_1_2: {
              ...freshServerDraft.tasks.TASK_1_2,
              images: input.tasks.TASK_1_2.images,
              visualContext: input.tasks.TASK_1_2.visualContext,
            },
          },
        }),
      );
    queryState.refetch.mockResolvedValueOnce({ data: freshServerDraft });
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    fireEvent.change(title, {
      target: { value: "Görsel yükleyen eski yerel sürüm" },
    });
    queryState.view = freshServerDraft;
    editor.refresh();
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await screen.findByText("Daha yeni bir sürüm var");
    await user.click(screen.getByRole("tab", { name: /Bölüm 1\.2/ }));
    const fileInput = editor.container.querySelector<HTMLInputElement>(
      ".ant-upload input[type=file]",
    );
    expect(fileInput).not.toBeNull();
    await user.upload(
      fileInput!,
      new File(["old-image"], "old-image.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Son sürümü aç" }));
    await waitFor(() =>
      expect(title).toHaveValue("Görselli yeni sunucu sürümü"),
    );

    await act(async () => {
      upload.resolve({ data: { reference: "old-upload-completion" } });
      await upload.promise;
    });
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));

    expect(mutations.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          tasks: expect.objectContaining({
            TASK_1_2: expect.objectContaining({
              images: ["fresh-image-a", "fresh-image-b"],
            }),
          }),
        }),
      }),
    );
    expect(
      editor.queryClient.getQueryData([
        "speaking-v2",
        "detail",
        "test-v2",
      ]),
    ).toEqual(expect.objectContaining({
      title: "Görselli yeni sunucu sürümü",
      tasks: expect.objectContaining({
        TASK_1_2: expect.objectContaining({
          images: ["fresh-image-a", "fresh-image-b"],
        }),
      }),
    }));
  });

  it("does not save a pending upload after the editor unmounts", async () => {
    const user = userEvent.setup();
    let resolveUpload: ((value: { data: { reference: string } }) => void) | undefined;
    mutations.upload.mockImplementationOnce(
      () =>
        new Promise<{ data: { reference: string } }>((resolve) => {
          resolveUpload = resolve;
        }),
    );
    const editor = renderEditor();

    await user.click(screen.getByRole("tab", { name: /Bölüm 1\.2/ }));
    const fileInput = editor.container.querySelector<HTMLInputElement>(
      ".ant-upload input[type=file]",
    );
    expect(fileInput).not.toBeNull();
    await user.upload(fileInput!, new File(["image"], "new-image.png", { type: "image/png" }));
    editor.unmount();

    await act(async () => {
      resolveUpload?.({ data: { reference: "uploaded-after-unmount" } });
    });

    expect(mutations.save).not.toHaveBeenCalled();
  });

  it("flushes a dirty draft when the editor unmounts", async () => {
    const user = userEvent.setup();
    const editor = renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });

    await user.clear(title);
    await user.type(title, "Sayfadan ayrılmadan önce kaydet");
    editor.unmount();

    await waitFor(() => expect(mutations.save).toHaveBeenCalledTimes(1));
  });

  it("gives multiple audio rows unique labels and prevents duplicate prompt generation", async () => {
    const user = userEvent.setup();
    let resolveGeneration: ((value: SpeakingV2AdminView) => void) | undefined;
    const withStaleAudio = {
      ...editorFixture,
      audioItems: [
        {
          key: "TASK_1_1_Q1" as const,
          taskCode: "TASK_1_1" as const,
          status: "STALE" as const,
          audioObjectKey: "pmr.v1.old-audio",
          previewUrl: "/preview/old-audio",
          generatedAt: "2026-08-17T12:00:00.000Z",
          error: null,
        },
        {
          key: "TASK_1_1_Q2" as const,
          taskCode: "TASK_1_1" as const,
          status: "STALE" as const,
          audioObjectKey: "pmr.v1.old-audio-2",
          previewUrl: "/preview/old-audio-2",
          generatedAt: "2026-08-17T12:00:00.000Z",
          error: null,
        },
      ],
    } as SpeakingV2AdminView;
    queryState.view = withStaleAudio;
    mutations.save.mockResolvedValueOnce(withStaleAudio);
    mutations.generate.mockImplementationOnce(
      () =>
        new Promise<SpeakingV2AdminView>((resolve) => {
          resolveGeneration = resolve;
        }),
    );
    renderEditor();

    expect(screen.getByText("Bölüm 1.1 · Soru 1")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Bölüm 1.1 · Soru 1 ses önizlemesi"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bölüm 1.1 · Soru 2")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Bölüm 1.1 · Soru 2 ses önizlemesi"),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Bölüm 1.1 · Soru 1" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Bölüm 1.1 · Soru 2" })).toBeInTheDocument();
    const retry = screen.getAllByRole("button", {
      name: "Sesi yeniden hazırla",
    })[0];
    await user.click(retry);
    await user.click(retry);

    expect(retry).toBeDisabled();
    expect(mutations.generate).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveGeneration?.(withStaleAudio);
    });
  });
});
