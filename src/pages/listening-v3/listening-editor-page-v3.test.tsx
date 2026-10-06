import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import ListeningEditorPageV3 from "./listening-editor-page-v3";
import { serializeOfficialListeningDraft } from "./listening-editor-model";
import { completeListeningDraft, deferred } from "./test/listening-draft-fixture";

const mocks = vi.hoisted(() => ({
  tests: {} as Record<string, Record<string, unknown>>,
  update: vi.fn(), create: vi.fn(), revise: vi.fn(), publish: vi.fn(), align: vi.fn(), load: vi.fn(), upload: vi.fn(),
}));
vi.mock("@/config/queries/listening/get-one.queries", () => ({
  useGetListeningTestWithAddition: (id: string) => ({ data: { data: mocks.tests[id] }, isLoading: false, isError: false }),
}));
vi.mock("@/config/queries/listening/update.queries", () => ({
  useUpdateListeningTestWithAddition: () => ({ mutateAsync: mocks.update, isPending: false }),
}));
vi.mock("@/config/queries/listening/create.queries", () => ({
  useCreateListeningTestWithAddition: () => ({ mutateAsync: mocks.create, isPending: false }),
}));
vi.mock("@/config/queries/listening/authoring.queries", async (original) => ({
  ...await original<typeof import("@/config/queries/listening/authoring.queries")>(),
  useReviseListeningTest: () => ({ mutateAsync: mocks.revise, isPending: false }),
  loadListeningAuthoringTest: mocks.load,
}));
vi.mock("@/config/queries/test/publication.queries", () => ({
  usePublishMockTest: () => ({ mutateAsync: mocks.publish, isPending: false }),
  useAlignListeningTranscript: () => ({ mutateAsync: mocks.align, isPending: false }),
}));
vi.mock("@/config/queries/file/upload.queries", () => ({
  useFileUpload: () => ({ isPending: false, mutateAsync: mocks.upload }),
  createFileAccessUrl: vi.fn(), createFileDownloadUrl: vi.fn(),
}));
const apiFixture = (id = "test-1") => ({ ...serializeOfficialListeningDraft(completeListeningDraft(id)), id, status: "DRAFT", publishedAt: null, contentRevision: 1 });
const renderEditor = () => {
  const router = createMemoryRouter([
    { path: "/listening/:ieltsId/edit-v3", element: <><Link to="/other">Başka sayfa</Link><ListeningEditorPageV3 /></> },
    { path: "/listening", element: <p>Dinleme listesi</p> },
    { path: "/other", element: <p>Diğer sayfa</p> },
  ], { initialEntries: ["/listening", "/listening/test-1/edit-v3"] });
  render(<RouterProvider router={router} />);
  return router;
};
beforeEach(() => {
  vi.clearAllMocks();
  // These routes have no loaders; keep jsdom's AbortSignal out of Node Request.
  vi.stubGlobal("Request", class extends Request {
    constructor(input: RequestInfo | URL, init?: RequestInit) { super(input, { ...init, signal: undefined }); }
  });
  mocks.tests = { "test-1": apiFixture() };
  mocks.update.mockImplementation(async ({ id, ...data }: { id: string } & Record<string, unknown>) => ({ data: { ...mocks.tests[id], ...data, id, contentRevision: Number(mocks.tests[id].contentRevision) + 1 } }));
  mocks.publish.mockResolvedValue({ status: "PUBLISHED" });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("ListeningEditorPageV3 draft protection", () => {
  it.each(["back", "link", "history"])("protects dirty %s navigation and keeps edits when cancelled", async (navigation) => {
    const router = renderEditor();
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Korunacak başlık" } });
    if (navigation === "back") fireEvent.click(screen.getByRole("button", { name: "Dinleme testlerine dön" }));
    else if (navigation === "link") fireEvent.click(screen.getByRole("link", { name: "Başka sayfa" }));
    else await act(async () => { await router.navigate(-1); });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/listening/test-1/edit-v3");
    fireEvent.click(screen.getByRole("button", { name: "Düzenlemeye devam et" }));
    expect(screen.getByLabelText("Test adı")).toHaveValue("Korunacak başlık");
    fireEvent.click(screen.getByRole("button", { name: "Dinleme testlerine dön" }));
    fireEvent.click(screen.getByRole("button", { name: "Kaydetmeden ayrıl" }));
    expect(await screen.findByText("Dinleme listesi")).toBeInTheDocument();
  });

  it("blocks departure while saving and sends the latest acknowledged revision on retry", async () => {
    const saving = deferred<unknown>();
    mocks.update.mockReturnValueOnce(saving.promise);
    renderEditor();
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Kaydedilen başlık" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(mocks.update.mock.calls[0][0].expectedContentRevision).toBe(1);
    fireEvent.click(screen.getByRole("link", { name: "Başka sayfa" }));
    expect(await screen.findByRole("button", { name: "Kaydetmeden ayrıl" })).toBeDisabled();
    await act(async () => saving.resolve({ data: { ...apiFixture(), title: "Kaydedilen başlık", contentRevision: 2 } }));
    fireEvent.click(screen.getByRole("button", { name: "Düzenlemeye devam et" }));
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yeni başlık" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
    expect(mocks.update.mock.calls[1][0]).toMatchObject({ title: "Yeni başlık", expectedContentRevision: 2 });
  });

  it.each(["PUBLISHED", "DRAFT"])("keeps historically published %s content read-only until revision is saved", async (status) => {
    mocks.tests["test-1"] = { ...apiFixture(), status, publishedAt: "2026-09-12T00:00:00Z" };
    mocks.revise.mockImplementation(async ({ title }: { title: string }) => {
      const revised = { ...apiFixture("test-2"), title, contentRevision: 2 };
      mocks.tests["test-2"] = revised;
      return { data: revised };
    });
    const router = renderEditor();
    expect(screen.getByLabelText("Test adı")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Taslağı kaydet" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Yeni sürüm oluştur" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/listening/test-2/edit-v3"));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.revise.mock.calls[0][0]).toMatchObject({ id: "test-1", title: "Dinleme testi", expectedContentRevision: 1 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Test adı")).toHaveValue("Dinleme testi");
    expect(screen.getByLabelText("Test adı")).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yeni sürümün başlığı" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ id: "test-2", expectedContentRevision: 2 });
    expect(mocks.update.mock.calls[0][0].parts[0].sections[0].questions[0].id).toBe("test-2-question-1");
  });

  it("retains edits and offers revision when the server reports an admitted test", async () => {
    mocks.update.mockRejectedValueOnce({ response: { data: { response: { code: "MOCK_PUBLISHED_TEST_IN_USE" } } } });
    renderEditor();
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Korunan düzenleme" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(await screen.findByRole("button", { name: "Yeni sürüm oluştur" })).toBeEnabled();
    expect(screen.getByLabelText("Test adı")).toHaveValue("Korunan düzenleme");
    expect(screen.getByText("Kaydedilmemiş değişiklikler var")).toBeInTheDocument();
  });

  it("finishes publishing after saving without a dirty-navigation dialog", async () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yayın başlığı" } });
    fireEvent.click(screen.getByRole("button", { name: "Yayın kontrolü" }));
    fireEvent.click(screen.getByRole("button", { name: "Kaydet ve yayınla" }));
    expect(await screen.findByText("Dinleme listesi")).toBeInTheDocument();
    expect(mocks.publish).toHaveBeenCalledWith("test-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

it("retains the saved revision when alignment fails and retries with current canonical data", async () => {
  const aligning = deferred<unknown>();
  mocks.align.mockReturnValueOnce(aligning.promise);
  renderEditor();
  fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Eşleştirilecek başlık" } });
  fireEvent.click(screen.getByRole("button", { name: "Otomatik eşleştir" }));
  await waitFor(() => expect(mocks.align).toHaveBeenCalledWith("test-1"));
  expect(screen.getByLabelText("Test adı")).toBeDisabled();
  await act(async () => aligning.reject(new Error("alignment unavailable")));
  expect(screen.getByLabelText("Test adı")).toHaveValue("Eşleştirilecek başlık");
  fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
  expect(mocks.update.mock.calls[1][0]).toMatchObject({ expectedContentRevision: 2, title: "Eşleştirilecek başlık" });
});

it("uses the saved revision on retry after publishing fails", async () => {
  const publishing = deferred<unknown>();
  mocks.publish.mockReturnValueOnce(publishing.promise);
  renderEditor();
  fireEvent.click(screen.getByRole("button", { name: "Yayın kontrolü" }));
  fireEvent.click(screen.getByRole("button", { name: "Kaydet ve yayınla" }));
  await waitFor(() => expect(mocks.publish).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText("Test adı")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Kaydet ve yayınla" }));
  expect(mocks.publish).toHaveBeenCalledTimes(1);
  await act(async () => publishing.reject(new Error("publish unavailable")));
  fireEvent.click(screen.getByRole("button", { name: "Kapat" }));
  fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
  expect(mocks.update.mock.calls[1][0].expectedContentRevision).toBe(2);
});


it("navigates a newly created draft to its canonical test ID without a dirty leave dialog", async () => {
  mocks.create.mockImplementation(async ({ title }: { title: string }) => {
    const saved = { ...apiFixture("created-test"), title };
    mocks.tests["created-test"] = saved;
    return { data: saved };
  });
  const router = createMemoryRouter([
    { path: "/listening/new/:ieltsId", element: <ListeningEditorPageV3 /> },
    { path: "/listening/:ieltsId/edit-v3", element: <ListeningEditorPageV3 /> },
  ], { initialEntries: ["/listening/new/group-1"] });
  render(<RouterProvider router={router} />);
  fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yeni dinleme" } });
  fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/listening/created-test/edit-v3"));
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.create.mock.calls[0][0]).toMatchObject({ ieltsId: "group-1", title: "Yeni dinleme" });
  await waitFor(() => expect(screen.getByLabelText("Test adı")).toHaveValue("Yeni dinleme"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

const prepareMediaUpload = (kind: "audio" | "image") => {
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL() { return "blob:synthetic-upload"; }
    static revokeObjectURL() {}
  });
  let metadataAudio: HTMLAudioElement | undefined;
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
    const element = createElement(tagName, options);
    if (tagName === "audio") metadataAudio = element as HTMLAudioElement;
    return element;
  });
  if (kind === "image") fireEvent.click(screen.getByRole("button", { name: /^Bölüm 4/ }));
  const input = document.querySelector<HTMLInputElement>(`input[accept="${kind}/*"]`)!;
  const file = new File(["synthetic"], kind === "audio" ? "audio.mp3" : "map.png", { type: kind === "audio" ? "audio/mpeg" : "image/png" });
  const begin = () => fireEvent.change(input, { target: { files: [file] } });
  return {
    begin,
    metadata: (valid = true) => {
      expect(metadataAudio).toBeDefined();
      if (valid) {
        Object.defineProperty(metadataAudio!, "duration", { configurable: true, value: 120 });
        fireEvent.loadedMetadata(metadataAudio!);
      } else fireEvent.error(metadataAudio!);
    },
  };
};

it.each(["image", "audio"] as const)("locks %s preparation/upload, protects navigation and preserves the canonical revision", async (kind) => {
  const upload = deferred<unknown>();
  mocks.upload.mockReturnValueOnce(upload.promise);
  mocks.tests["test-1"] = { ...apiFixture(), title: "Kayıtlı başlık", contentRevision: 2 };
  const router = renderEditor();
  const media = prepareMediaUpload(kind);
  media.begin();
  // A second file event and same-turn save may not start another operation.
  media.begin();
  expect(screen.getByLabelText("Test adı")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Kayda girmemeli" } });
  fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
  expect(mocks.update).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Test adı")).toHaveValue("Kayıtlı başlık");
  if (kind === "audio") {
    expect(mocks.upload).not.toHaveBeenCalled();
    await act(async () => media.metadata());
  }
  expect(mocks.upload).toHaveBeenCalledTimes(1);
  const unload = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  fireEvent.click(screen.getByRole("link", { name: "Başka sayfa" }));
  expect(await screen.findByRole("button", { name: "Kaydetmeden ayrıl" })).toBeDisabled();
  expect(router.state.location.pathname).toBe("/listening/test-1/edit-v3");
  await act(async () => upload.resolve({ data: { reference: `uploads/new-${kind}` } }));
  fireEvent.click(screen.getByRole("button", { name: "Düzenlemeye devam et" }));
  expect(screen.getByLabelText("Test adı")).toBeEnabled();
  expect(screen.getByText("Kaydedilmemiş değişiklikler var")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
  const saved = mocks.update.mock.calls[0][0];
  expect(saved).toMatchObject({ title: "Kayıtlı başlık", expectedContentRevision: 2 });
  if (kind === "audio") {
    expect(saved).toMatchObject({ audioUrl: "uploads/new-audio", audioDurationSeconds: 120 });
    expect(saved.parts[0].sections[0].questions[0].evidence).toMatchObject({ audioStartMs: 0, audioEndMs: 0 });
  } else expect(saved.parts[3].sections[0].imageUrl).toBe("uploads/new-image");
});

it.each(["image", "audio"] as const)("unlocks after a failed %s upload and preserves the original media and edits", async (kind) => {
  const upload = deferred<unknown>();
  mocks.upload.mockReturnValueOnce(upload.promise);
  renderEditor();
  fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Korunan düzenleme" } });
  const media = prepareMediaUpload(kind);
  media.begin();
  if (kind === "audio") await act(async () => media.metadata());
  expect(screen.getByLabelText("Test adı")).toBeDisabled();
  await act(async () => upload.reject(new Error("synthetic upload error")));
  expect(screen.getByLabelText("Test adı")).toBeEnabled();
  expect(screen.getByLabelText("Test adı")).toHaveValue("Korunan düzenleme");
  fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
  const saved = mocks.update.mock.calls[0][0];
  expect(saved.audioUrl).toBe("uploads/listening.mp3");
  expect(saved.parts[3].sections[0].imageUrl).toBe("uploads/map.png");
});

it("unlocks after unreadable audio metadata without starting an upload", async () => {
  renderEditor();
  const media = prepareMediaUpload("audio");
  media.begin();
  expect(screen.getByLabelText("Test adı")).toBeDisabled();
  expect(mocks.upload).not.toHaveBeenCalled();
  await act(async () => media.metadata(false));
  expect(screen.getByLabelText("Test adı")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Taslağı kaydet" })).toBeEnabled();
  expect(mocks.upload).not.toHaveBeenCalled();
});
