import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";

import WritingEditorPageV2 from "./writing-editor-page-v2";
import { WRITING_TASK_DEFINITIONS, type WritingTestV2, type WritingTestV2Payload } from "./types";

const mocks = vi.hoisted(() => ({
  tests: {} as Record<string, WritingTestV2>,
  update: vi.fn(),
  revise: vi.fn(),
  publish: vi.fn(),
  archive: vi.fn(),
}));

vi.mock("@/config/queries/writing/v2.queries", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/config/queries/writing/v2.queries")>(),
  useGetWritingTestV2: (id: string) => ({ data: mocks.tests[id], isLoading: false }),
  useUpdateWritingTestV2: () => ({ mutateAsync: mocks.update, isPending: false }),
  useReviseWritingTestV2: () => ({ mutateAsync: mocks.revise, isPending: false }),
  usePublishWritingTestV2: () => ({ mutateAsync: mocks.publish, isPending: false }),
  useArchiveWritingTestV2: () => ({ mutateAsync: mocks.archive, isPending: false }),
}));

vi.mock("@/config/queries/ielts/get-all.queries", () => ({
  useGetAllIelts: () => ({ data: { ieltsData: [{ id: "package-1", title: "Paket 1" }] }, isLoading: false }),
}));

const doc = (text: string) => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
const fixture = (id = "test-1"): WritingTestV2 => ({
  id, title: "Yazma denemesi", ieltsId: "package-1", formatVersion: 2,
  status: "DRAFT", durationMinutes: 60, instruction: "Bağlam", sourceEmail: doc("Gelen e-posta metni"),
  sections: [{
    id: "section-1", title: "Görevler", order: 1, writingTestId: id,
    subParts: WRITING_TASK_DEFINITIONS.map((task, index) => ({
      ...task, id: `task-${index}`, title: task.label, order: index + 1,
      writingSectionId: "section-1", promptJson: doc(`${task.label} yönergesi`),
    })),
  }],
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const renderEditor = () => {
  const router = createMemoryRouter([
    { path: "/writing/:id/edit-v2", element: <><Link to="/other">Başka sayfa</Link><WritingEditorPageV2 /></> },
    { path: "/writing", element: <p>Yazma listesi</p> },
    { path: "/other", element: <p>Diğer sayfa</p> },
  ], { initialEntries: ["/writing", "/writing/test-1/edit-v2"] });
  render(<RouterProvider router={router} />);
  return router;
};

beforeEach(() => {
  vi.clearAllMocks();
  // These routes have no loaders. Avoid mixing Node Request with jsdom's
  // AbortSignal; navigation blocking still runs through the real router.
  vi.stubGlobal("Request", class extends Request {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(input, { ...init, signal: undefined });
    }
  });
  mocks.tests = { "test-1": fixture() };
  mocks.update.mockImplementation(async ({ id, data }: { id: string; data: WritingTestV2Payload }) => ({ ...mocks.tests[id], ...data }));
  mocks.publish.mockImplementation(async (id: string) => ({ ...mocks.tests[id], status: "PUBLISHED" }));
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({
    matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })) });
  const getStyle = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => getStyle(element));
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("WritingEditorPageV2 draft protection", () => {
  it("locks text, rich text and metadata until saving finishes, then accepts new edits", async () => {
    const user = userEvent.setup();
    const saving = deferred<WritingTestV2>();
    mocks.update.mockReturnValue(saving.promise);
    renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });
    fireEvent.change(title, { target: { value: "Kaydedilen başlık" } });
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(title).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "E-posta öncesi bağlam" })).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Gelen e-posta" })).toHaveAttribute("contenteditable", "false");
    expect(screen.getByRole("textbox", { name: "Adaydan istenenler" })).toHaveAttribute("contenteditable", "false");
    await user.click(screen.getByRole("tab", { name: "Bölüm 2" }));
    expect(screen.getByRole("textbox", { name: "Bölüm 2 metni" })).toHaveAttribute("contenteditable", "false");
    await user.type(title, " yeni cümle");
    expect(title).toHaveValue("Kaydedilen başlık");
    await act(async () => saving.resolve({ ...fixture(), title: "Kaydedilen başlık" }));
    expect(title).toBeEnabled();
    expect(screen.queryByText("Kaydedilmemiş değişiklik")).not.toBeInTheDocument();
    await user.type(title, " yeni cümle");
    expect(title).toHaveValue("Kaydedilen başlık yeni cümle");
    expect(screen.getByText("Kaydedilmemiş değişiklik")).toBeInTheDocument();
  });

  it("retains unsaved edits and unlocks the editor when saving fails", async () => {
    const saving = deferred<WritingTestV2>();
    mocks.update.mockReturnValue(saving.promise);
    renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });
    fireEvent.change(title, { target: { value: "Korunacak başlık" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await act(async () => saving.reject(new Error("offline")));
    expect(title).toBeEnabled();
    expect(title).toHaveValue("Korunacak başlık");
    expect(screen.getByText("Kaydedilmemiş değişiklik")).toBeInTheDocument();
  });

  it("ignores a second save before the first response arrives", async () => {
    const saving = deferred<WritingTestV2>();
    mocks.update.mockReturnValue(saving.promise);
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(mocks.update).toHaveBeenCalledTimes(1);
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    await act(async () => saving.resolve(fixture()));
  });

  it("locks the entire save/publish sequence and leaves saved content available after a publish failure", async () => {
    const publishing = deferred<WritingTestV2>();
    mocks.publish.mockReturnValue(publishing.promise);
    renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });
    fireEvent.change(title, { target: { value: "Yayına hazır" } });
    fireEvent.click(screen.getByRole("button", { name: "Yayınla" }));
    await waitFor(() => expect(mocks.publish).toHaveBeenCalledWith("test-1"));
    expect(title).toBeDisabled();
    await act(async () => publishing.reject(new Error("validation")));
    expect(title).toBeEnabled();
    expect(title).toHaveValue("Yayına hazır");
    expect(screen.queryByText("Kaydedilmemiş değişiklik")).not.toBeInTheDocument();
  });

  it("allows clean navigation and asks before discarding dirty changes from the page back button", async () => {
    const user = userEvent.setup();
    const router = renderEditor();
    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), { target: { value: "Kaydedilmedi" } });
    await user.click(screen.getByRole("button", { name: "Yazma testlerine dön" }));
    expect(router.state.location.pathname).toContain("edit-v2");
    await user.click(screen.getByRole("button", { name: "Düzenlemeye devam et" }));
    expect(screen.getByRole("textbox", { name: "Test adı" })).toHaveValue("Kaydedilmedi");
    await user.click(screen.getByRole("button", { name: "Yazma testlerine dön" }));
    await user.click(screen.getByRole("button", { name: "Kaydetmeden ayrıl" }));
    expect(await screen.findByText("Yazma listesi")).toBeInTheDocument();
  });

  it.each(["link", "history"])("protects dirty %s navigation", async (navigation) => {
    const user = userEvent.setup();
    const router = renderEditor();
    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), { target: { value: "Kaydedilmedi" } });
    if (navigation === "link") await user.click(screen.getByRole("link", { name: "Başka sayfa" }));
    else await act(async () => { await router.navigate(-1); });
    expect(router.state.location.pathname).toContain("edit-v2");
    await user.click(screen.getByRole("button", { name: "Düzenlemeye devam et" }));
    expect(router.state.location.pathname).toContain("edit-v2");
  });

  it("does not ask when leaving a clean editor", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Yazma testlerine dön" }));
    expect(await screen.findByText("Yazma listesi")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks page unload while dirty and keeps route departure disabled until a save completes", async () => {
    const saving = deferred<WritingTestV2>();
    mocks.update.mockReturnValue(saving.promise);
    renderEditor();
    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), { target: { value: "Bekleyen" } });
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    fireEvent.click(screen.getByRole("button", { name: "Yazma testlerine dön" }));
    expect(await screen.findByRole("button", { name: "Kaydetmeden ayrıl" })).toBeDisabled();
    await act(async () => saving.resolve({ ...fixture(), title: "Bekleyen" }));
    expect(screen.getByRole("button", { name: "Ayrıl" })).toBeEnabled();
    const cleanUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanUnload);
    expect(cleanUnload.defaultPrevented).toBe(false);
  });

  it.each([false, true])("opens a published revision safely (publish afterwards: %s)", async (publishAfterRevision) => {
    const user = userEvent.setup();
    mocks.tests["test-1"].status = "PUBLISHED";
    mocks.update.mockRejectedValue({ code: "WRITING_PUBLISHED_TEST_IN_USE" });
    const revising = deferred<WritingTestV2>();
    mocks.revise.mockReturnValue(revising.promise);
    const router = renderEditor();
    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), { target: { value: "Yeni sürüm" } });
    await user.click(screen.getByRole("button", { name: publishAfterRevision ? "Yayınla" : "Taslağı kaydet" }));
    expect(await screen.findByText(/Yayımlanmış testin içeriği doğrudan değiştirilemez/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: publishAfterRevision ? "Yeni sürümü yayınla" : "Yeni taslak oluştur" }));
    expect(screen.getByRole("textbox", { name: "Test adı" })).toBeDisabled();
    const revised = { ...fixture("test-2"), title: "Yeni sürüm" };
    mocks.tests["test-2"] = revised;
    await act(async () => revising.resolve(revised));
    await waitFor(() => expect(router.state.location.pathname).toBe("/writing/test-2/edit-v2"));
    expect(screen.getByRole("textbox", { name: "Test adı" })).toHaveValue("Yeni sürüm");
    expect(screen.queryByText("Kaydedilmemiş değişiklik")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    if (publishAfterRevision) expect(mocks.publish).toHaveBeenCalledWith("test-2");
    else expect(mocks.publish).not.toHaveBeenCalled();
  });

  it("retains the current edits when creating a revision fails, and permits retry", async () => {
    const user = userEvent.setup();
    mocks.tests["test-1"].status = "PUBLISHED";
    mocks.update.mockRejectedValue({ code: "WRITING_PUBLISHED_TEST_IN_USE" });
    mocks.revise.mockRejectedValueOnce(new Error("offline"));
    const router = renderEditor();
    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), { target: { value: "Yeni sürüm" } });
    await user.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await user.click(await screen.findByRole("button", { name: "Yeni taslak oluştur" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Yeni taslak oluştur" })).toBeEnabled());
    expect(router.state.location.pathname).toBe("/writing/test-1/edit-v2");
    expect(screen.getByRole("textbox", { name: "Test adı" })).toHaveValue("Yeni sürüm");
    expect(screen.getByText("Kaydedilmemiş değişiklik")).toBeInTheDocument();
    const revised = { ...fixture("test-2"), title: "Yeni sürüm" };
    mocks.tests["test-2"] = revised;
    mocks.revise.mockResolvedValueOnce(revised);
    await user.click(screen.getByRole("button", { name: "Yeni taslak oluştur" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/writing/test-2/edit-v2"));
  });

  it("retains a created revision if its publication fails, so retry saves the new draft", async () => {
    const user = userEvent.setup();
    mocks.tests["test-1"].status = "PUBLISHED";
    mocks.update.mockRejectedValueOnce({ code: "WRITING_PUBLISHED_TEST_IN_USE" });
    const revised = { ...fixture("test-2"), title: "Yeni sürüm" };
    mocks.tests["test-2"] = revised;
    mocks.revise.mockResolvedValueOnce(revised);
    mocks.publish.mockRejectedValueOnce(new Error("publication failed"));
    const router = renderEditor();
    fireEvent.change(screen.getByRole("textbox", { name: "Test adı" }), { target: { value: "Yeni sürüm" } });
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    await user.click(await screen.findByRole("button", { name: "Yeni sürümü yayınla" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/writing/test-2/edit-v2"));
    // Router state updates before the transitioned editor commit. Wait for the
    // new draft to render before simulating a retry on that draft.
    await screen.findByText("Taslak", { exact: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Test adı" })).toHaveValue("Yeni sürüm");
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    await waitFor(() => expect(mocks.publish).toHaveBeenCalledTimes(2));
    expect(mocks.revise).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[1][0].id).toBe("test-2");
  });

  it("warns that archiving discards edits and locks the editor until the confirmed archive finishes", async () => {
    const user = userEvent.setup();
    const archiving = deferred<WritingTestV2>();
    mocks.archive.mockReturnValue(archiving.promise);
    renderEditor();
    const title = screen.getByRole("textbox", { name: "Test adı" });
    fireEvent.change(title, { target: { value: "Kaydedilmedi" } });
    await user.click(screen.getByRole("button", { name: "Arşivle" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Kaydedilmemiş değişiklikleriniz kaybolacak/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Arşivle" }));
    expect(title).toBeDisabled();
    await act(async () => archiving.resolve({ ...fixture(), status: "ARCHIVED" }));
    expect(await screen.findByText("Yazma listesi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kaydetmeden ayrıl" })).not.toBeInTheDocument();
  });

  it.each(["Dergi makalesi", "Blog / forum / makale", "Kompozisyon"])("uses contextual Task 2 defaults and preserves authored metadata: %s", async (genre) => {
    const task = mocks.tests["test-1"].sections![0].subParts![2];
    task.genre = genre;
    task.register = "Resmî";
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    const submitted = mocks.update.mock.calls[0][0].data as WritingTestV2Payload;
    expect(submitted.tasks[2]).toMatchObject({ genre, register: "Resmî" });
    expect(WRITING_TASK_DEFINITIONS[2]).toMatchObject({
      genre: "Blog/forum/dergi yazısı",
      register: "Görevde belirtilen okur ve yayın türüne uygun üslup",
    });
  });
});
