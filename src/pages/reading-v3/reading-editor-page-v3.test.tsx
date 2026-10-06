import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import ReadingEditorPageV3 from "./reading-editor-page-v3";
import { serializeOfficialReadingDraft } from "./reading-editor-model";
import { completeReadingDraft, deferred } from "./test/reading-draft-fixture";

const mocks = vi.hoisted(() => ({
  tests: {} as Record<string, Record<string, unknown>>,
  update: vi.fn(), create: vi.fn(), revise: vi.fn(), publish: vi.fn(),
}));
vi.mock("@/config/queries/reading/get-one.queries", () => ({
  useGetReadingTestWithAddition: (id: string) => ({ data: { data: mocks.tests[id] }, isLoading: false, isError: false }),
}));
vi.mock("@/config/queries/reading/update.queries", () => ({
  useUpdateReadingTestWithAddition: () => ({ mutateAsync: mocks.update, isPending: false }),
}));
vi.mock("@/config/queries/reading/create.queries", () => ({
  useCreateReadingTestWithAddition: () => ({ mutateAsync: mocks.create, isPending: false }),
}));
vi.mock("@/config/queries/reading/authoring.queries", async (original) => ({
  ...await original<typeof import("@/config/queries/reading/authoring.queries")>(),
  useReviseReadingTest: () => ({ mutateAsync: mocks.revise, isPending: false }),
}));
vi.mock("@/config/queries/test/publication.queries", () => ({
  usePublishMockTest: () => ({ mutateAsync: mocks.publish, isPending: false }),
}));
const apiFixture = (id = "test-1") => ({ ...serializeOfficialReadingDraft(completeReadingDraft(id)), id, status: "DRAFT", publishedAt: null, contentRevision: 1 });
const renderEditor = () => {
  const router = createMemoryRouter([
    { path: "/reading/:ieltsId/edit-v3", element: <><Link to="/other">Başka sayfa</Link><ReadingEditorPageV3 /></> },
    { path: "/reading", element: <p>Okuma listesi</p> },
    { path: "/other", element: <p>Diğer sayfa</p> },
  ], { initialEntries: ["/reading", "/reading/test-1/edit-v3"] });
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

describe("ReadingEditorPageV3 draft protection", () => {
  it.each(["back", "link", "history"])("protects dirty %s navigation and keeps edits when cancelled", async (navigation) => {
    const router = renderEditor();
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Korunacak başlık" } });
    if (navigation === "back") fireEvent.click(screen.getByRole("button", { name: "Okuma testlerine dön" }));
    else if (navigation === "link") fireEvent.click(screen.getByRole("link", { name: "Başka sayfa" }));
    else await act(async () => { await router.navigate(-1); });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/reading/test-1/edit-v3");
    fireEvent.click(screen.getByRole("button", { name: "Düzenlemeye devam et" }));
    expect(screen.getByLabelText("Test adı")).toHaveValue("Korunacak başlık");
    fireEvent.click(screen.getByRole("button", { name: "Okuma testlerine dön" }));
    fireEvent.click(screen.getByRole("button", { name: "Kaydetmeden ayrıl" }));
    expect(await screen.findByText("Okuma listesi")).toBeInTheDocument();
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

  it("navigates to a saved explicit revision without discarding the revised title", async () => {
    mocks.tests["test-1"] = { ...apiFixture(), status: "PUBLISHED", publishedAt: "2026-09-12T00:00:00Z" };
    mocks.revise.mockImplementation(async ({ title }: { title: string }) => {
      const revised = { ...apiFixture("test-2"), title, contentRevision: 2 };
      mocks.tests["test-2"] = revised;
      return { data: revised };
    });
    const router = renderEditor();
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yeni sürüm" } });
    fireEvent.click(screen.getByRole("button", { name: "Yeni sürüm oluştur" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/reading/test-2/edit-v3"));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.revise.mock.calls[0][0]).toMatchObject({ id: "test-1", title: "Yeni sürüm", expectedContentRevision: 1 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Test adı")).toHaveValue("Yeni sürüm");
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
    fireEvent.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(await screen.findByText("Okuma listesi")).toBeInTheDocument();
    expect(mocks.publish).toHaveBeenCalledWith("test-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
