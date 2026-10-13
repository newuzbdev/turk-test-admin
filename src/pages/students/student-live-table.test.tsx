import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  dehydrate,
} from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";
import type { StudentLiveResponse } from "@/config/queries/students";
import StudentLiveTable from "./student-live-table";
import StudentDetail from "./student-detail";
import Students from "./students";
import { studentLiveQueryKey, useStudentLiveQuery } from "./student-live-query";
import { adminSubscriptionTransport } from "./student-subscription-query";
const originalPrivateAdapter = adminSubscriptionTransport.defaults.adapter;
const mocks = vi.hoisted(() => ({ get: vi.fn(), enabled: true }));
vi.mock("@/config/api", () => ({ default: { get: mocks.get } }));
vi.mock("@/config/queries/access", async (original) => ({
  ...(await original<object>()),
  useAccessConfig: () => ({
    data: { enabled: mocks.enabled },
    refetch: vi.fn(),
  }),
}));
const filters = { q: "", page: 1, limit: 25 };
const accountId = "f3245f75-7cf6-42f4-9d28-4cfa415f5624";
function CurrentPath() {
  return <output aria-label="Geçerli sayfa">{useLocation().pathname}</output>;
}
const counts = {
  mockStarted: 3,
  mockCompleted: 2,
  practiceCompleted: { reading: 1, listening: null, writing: 4, speaking: 5 },
} as const;
function data(
  overrides: Partial<StudentLiveResponse> = {},
): StudentLiveResponse {
  return {
    items: [
      {
        id: "ada",
        name: "Ada",
        email: "ada@example.test",
        telegramId: "123",
        telegramUsername: "ada",
        page: "MOCK_TEST",
        visible: true,
        lastSeenAt: new Date().toISOString(),
        activity: {
          state: "SOLVING",
          title: "Deneme 1",
          targetId: "target",
          attemptId: "attempt",
          section: "READING",
          startedAt: new Date().toISOString(),
          expiresAt: null,
        },
        counts,
      },
    ],
    total: 60,
    page: 1,
    limit: 25,
    registeredCount: 120,
    onlineCount: 26,
    solvingCount: 7,
    observedAt: new Date().toISOString(),
    onlineWindowSeconds: 90,
    ...overrides,
  };
}
function login(id = "admin-a", role = "ADMIN") {
  localStorage.setItem(
    "accessToken",
    `synthetic.${btoa(JSON.stringify({ id, role }))}.signature`,
  );
}
function visibility(visible: boolean) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visible ? "visible" : "hidden",
  });
  document.dispatchEvent(new Event("visibilitychange"));
}
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 300_000, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return { client, wrapper };
}
async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(5);
  });
}
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  await settle();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-06T00:00:00Z"));
  login();
  visibility(true);
  mocks.enabled = true;
  mocks.get.mockReset();
  mocks.get.mockImplementation(async () => ({
    data: { success: true, data: data() },
  }));
  // Exercise the privileged Axios path without permitting real API traffic.
  adminSubscriptionTransport.defaults.adapter = async (config) => ({
    ...(await mocks.get(config.url, config)),
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
  const original = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
    original(element),
  );
});
afterEach(() => {
  cleanup();
  adminSubscriptionTransport.defaults.adapter = originalPrivateAdapter;
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});
describe("live students", () => {
  it("keys safe filters separately by administrator without storing tokens", () => {
    expect(studentLiveQueryKey(filters, "admin-a")).toEqual([
      "admin",
      "students",
      "live",
      filters,
      "admin-a",
    ]);
    expect(studentLiveQueryKey(filters, "admin-a")).not.toEqual(
      studentLiveQueryKey(filters, "admin-b"),
    );
  });
  it("polls exactly three times over 60 seconds after the visible initial load", async () => {
    const { wrapper, client } = setup();
    renderHook(
      () => useStudentLiveQuery(filters, { enabled: true, visible: true }),
      { wrapper },
    );
    await settle();
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(client.getQueryCache().getAll()[0].isStale()).toBe(true);
    mocks.get.mockClear();
    await advance(60_000);
    expect(mocks.get).toHaveBeenCalledTimes(3);
  });
  it("does not load or poll while hidden or disabled", async () => {
    const { wrapper } = setup();
    const hook = renderHook(
      ({ enabled, visible }) =>
        useStudentLiveQuery(filters, { enabled, visible }),
      { wrapper, initialProps: { enabled: true, visible: false } },
    );
    await advance(60_000);
    expect(mocks.get).not.toHaveBeenCalled();
    hook.rerender({ enabled: false, visible: true });
    await advance(60_000);
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it("aborts the request when the document becomes hidden and resumes on visibility", async () => {
    const signals: AbortSignal[] = [];
    mocks.get.mockImplementation((_url, config) => {
      signals.push(config.signal);
      return new Promise(() => {});
    });
    const { wrapper } = setup();
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(signals).toHaveLength(1);
    act(() => visibility(false));
    await settle();
    expect(signals[0].aborted).toBe(true);
    await advance(60_000);
    expect(signals).toHaveLength(1);
    act(() => visibility(true));
    await settle();
    expect(signals).toHaveLength(2);
  });
  it("aborts and removes account A rows when the administrator changes", async () => {
    const { wrapper } = setup();
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(screen.getByText("Ada")).toBeVisible();
    let nextSignal: AbortSignal | undefined;
    mocks.get.mockImplementation((_url, config) => {
      nextSignal = config.signal;
      return new Promise(() => {});
    });
    act(() => {
      login("admin-b");
      window.dispatchEvent(new Event("storage"));
    });
    await settle();
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
    act(() => {
      localStorage.removeItem("accessToken");
      window.dispatchEvent(new Event("storage"));
    });
    await settle();
    expect(nextSignal?.aborted).toBe(true);
    await advance(60_000);
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
  it("detects same-tab account writes and rejects an old account response", async () => {
    let resolve!: (value: unknown) => void;
    mocks.get.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const { wrapper } = setup();
    render(<StudentLiveTable />, { wrapper });
    await settle();
    login("admin-b");
    mocks.get.mockImplementation(() => new Promise(() => {}));
    await act(async () => {
      resolve({ data: { success: true, data: data() } });
    });
    await advance(500);
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
  });
  it("aborts an in-flight request on unmount", async () => {
    let signal!: AbortSignal;
    mocks.get.mockImplementation((_url, config) => {
      signal = config.signal;
      return new Promise(() => {});
    });
    const { wrapper } = setup();
    const view = render(<StudentLiveTable />, { wrapper });
    await settle();
    view.unmount();
    await settle();
    expect(signal.aborted).toBe(true);
    await advance(60_000);
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });
  it("does not query for a student JWT and handles a synthetic server 403 as an error", async () => {
    login("student", "USER");
    const { wrapper } = setup();
    const view = render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(mocks.get).not.toHaveBeenCalled();
    view.unmount();
    login();
    mocks.get.mockRejectedValue({ response: { status: 403 } });
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(
      screen.getByText(
        "Canlı öğrenciler yüklenemedi. Canlı durum doğrulanamıyor.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Çevrimiçi")).not.toBeInTheDocument();
  });
  it("shows server totals, safe rows, unknown Listening, background and preparation", async () => {
    const payload = data();
    payload.items[0].device = {
      kind: "COMPUTER",
      os: "MACOS",
      browser: "SAFARI",
      observedAt: new Date().toISOString(),
    };
    payload.items[0].visible = false;
    payload.items[0].activity.state = "PREPARING";
    mocks.get.mockResolvedValue({ data: { success: true, data: payload } });
    const { wrapper } = setup();
    const view = render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(
      screen.getByText("Son 90 saniyede bağlantısı olan öğrenciler"),
    ).toBeVisible();
    expect(screen.getByText("Çevrimiçi")).toBeVisible();
    expect(screen.getByText("Arka planda")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Cihaz" })).toBeVisible();
    expect(screen.getByText("Mac bilgisayar")).toBeVisible();
    expect(screen.getByText("Safari")).toBeVisible();
    expect(screen.getByText("Hazırlık")).toBeVisible();
    fireEvent.click(
      view.container.querySelector(".ant-table-row-expand-icon")!,
    );
    await settle();
    expect(screen.getByText("Henüz ölçülmüyor")).toBeVisible();
    expect(screen.getByText("120")).toBeVisible();
    expect(view.container.querySelector("textarea")).toBeNull();
    expect(view.container.querySelector("audio")).toBeNull();
  });
  it("labels an unverified local attempt as a practice page", async () => {
    const payload = data();
    payload.items[0].page = "PRACTICE_TEST";
    payload.items[0].activity.state = "PAGE";
    mocks.get.mockResolvedValue({ data: { success: true, data: payload } });
    const { wrapper } = setup();
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(
      screen.getByText("Pratik sayfasında (çözüm doğrulanmadı)"),
    ).toBeVisible();
    expect(screen.queryByText("Çözüyor (doğrulanmış)")).not.toBeInTheDocument();
  });
  it("removes active badges and all totals after a failed refresh while retaining explicitly old rows", async () => {
    const { wrapper } = setup();
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(screen.getByText("Çevrimiçi")).toBeVisible();
    mocks.get.mockRejectedValue(new Error("synthetic unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));
    await settle();
    expect(screen.getByText("Ada")).toBeVisible();
    expect(screen.getByText("Eski veri")).toBeVisible();
    expect(screen.queryByText("Çevrimiçi")).not.toBeInTheDocument();
    expect(screen.queryByText("Çözüyor (doğrulanmış)")).not.toBeInTheDocument();
    expect(screen.queryByText("120")).not.toBeInTheDocument();
    expect(screen.queryByText("26")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Canlı öğrenciler yüklenemedi. Canlı durum doğrulanamıyor.",
      ),
    ).toBeVisible();
  });
  it("expires old observedAt without needing a failed request", async () => {
    mocks.get.mockResolvedValue({
      data: {
        success: true,
        data: data({ observedAt: "2026-10-05T23:58:29Z" }),
      },
    });
    const { wrapper } = setup();
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(screen.getByText("Eski veri")).toBeVisible();
    expect(screen.queryByText("Çevrimiçi")).not.toBeInTheDocument();
  });
  it("does not present retained cached data as fresh before a current-mount response", async () => {
    const { wrapper, client } = setup();
    client.setQueryData(studentLiveQueryKey(filters, "admin-a"), data());
    mocks.get.mockImplementation(() => new Promise(() => {}));
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(screen.getByText("Ada")).toBeVisible();
    expect(screen.getByText("Eski veri")).toBeVisible();
    expect(screen.queryByText("Çevrimiçi")).not.toBeInTheDocument();
    expect(
      dehydrate(client, {
        shouldDehydrateQuery: (query) =>
          query.queryKey[0] !== "admin" && query.meta?.persist !== false,
      }).queries,
    ).toEqual([]);
    expect(client.getQueryCache().getAll()[0].meta?.persist).toBe(false);
  });
  it("sends search, page, size and enum filters to the server and resets page on search", async () => {
    const { wrapper } = setup();
    render(<StudentLiveTable />, { wrapper });
    await settle();
    fireEvent.click(screen.getByTitle("2"));
    await settle();
    expect(mocks.get.mock.lastCall?.[1].params.page).toBe(2);
    const search = screen.getByRole("searchbox", { name: "Canlı öğrenci ara" });
    fireEvent.change(search, { target: { value: "ada" } });
    fireEvent.keyDown(search, { key: "Enter", code: "Enter" });
    await settle();
    expect(mocks.get.mock.lastCall?.[1].params).toEqual({
      q: "ada",
      page: 1,
      limit: 25,
    });
    fireEvent.mouseDown(
      screen.getByRole("combobox", { name: "Öğrenci sayfası" }),
    );
    await settle();
    fireEvent.click(screen.getByText("Profil"));
    await settle();
    expect(mocks.get.mock.lastCall?.[1].params.studentPage).toBe("PROFILE");
    fireEvent.mouseDown(
      screen.getByRole("combobox", { name: "Etkinlik durumu" }),
    );
    await settle();
    fireEvent.click(
      within(
        document.querySelector(
          ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
        ) as HTMLElement,
      ).getByText("Hazırlık"),
    );
    await settle();
    expect(mocks.get.mock.lastCall?.[1].params.state).toBe("PREPARING");
    expect(mocks.get.mock.lastCall?.[1].headers).toEqual({
      "Cache-Control": "no-store",
    });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Page Size" }));
    await settle();
    fireEvent.click(screen.getByText("100 / page"));
    await settle();
    expect(mocks.get.mock.lastCall?.[1].params.limit).toBe(100);
  });
  it("searches by the full profile account number and opens its management screen", async () => {
    const payload = data();
    payload.items[0].id = accountId;
    mocks.get.mockResolvedValue({ data: { success: true, data: payload } });
    const { wrapper } = setup();
    render(
      <>
        <StudentLiveTable />
        <CurrentPath />
      </>,
      { wrapper },
    );
    await settle();
    fireEvent.click(screen.getByTitle("2"));
    await settle();
    const search = screen.getByPlaceholderText(
      "Hesap numarası, ad, e-posta veya Telegram",
    );
    fireEvent.change(search, { target: { value: accountId.toUpperCase() } });
    fireEvent.keyDown(search, { key: "Enter", code: "Enter" });
    await settle();
    expect(mocks.get.mock.lastCall?.[1].params).toEqual({
      q: accountId.toUpperCase(),
      page: 1,
      limit: 25,
    });
    fireEvent.click(screen.getByRole("button", { name: "Hesabı yönet" }));
    expect(screen.getByLabelText("Geçerli sayfa")).toHaveTextContent(
      `/students/${accountId}`,
    );
  });
  it("mounts live only in the selected tab and stops polling on the directory tab", async () => {
    mocks.get.mockImplementation(async (url) => ({
      data: {
        success: true,
        data: url.endsWith("/live") ? data() : { items: [], total: 0 },
      },
    }));
    const { wrapper } = setup();
    render(<Students />, { wrapper });
    await settle();
    expect(mocks.get.mock.calls.some(([url]) => url.endsWith("/live"))).toBe(
      false,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Canlı" }));
    await settle();
    expect(screen.getByText("Ada")).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "Tüm öğrenciler" }));
    await settle();
    mocks.get.mockClear();
    await advance(60_000);
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it("shows loading, rollout and request failure without inventing fresh zero totals", async () => {
    mocks.get.mockImplementation(() => new Promise(() => {}));
    const { wrapper } = setup();
    const view = render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(view.container.querySelector(".ant-spin-spinning")).not.toBeNull();
    view.unmount();
    mocks.enabled = false;
    render(<StudentLiveTable />, { wrapper });
    await settle();
    expect(
      screen.getByText("Canlı öğrenci görünümü henüz etkin değil."),
    ).toBeVisible();
  });
  it("shows separate counters and bounded server history without calling started/pending/failed completed", async () => {
    mocks.get.mockImplementation(async (url) => ({
      data: {
        success: true,
        data: url.endsWith("/activity")
          ? {
              lastDevice: {
                kind: "PHONE",
                os: "ANDROID",
                browser: "CHROME",
                observedAt: new Date().toISOString(),
              },
              student: { id: "", name: "Ada" },
              counts,
              observedAt: new Date().toISOString(),
              onlineWindowSeconds: 90,
              activePages: [],
              history: {
                items: [
                  {
                    id: "reading",
                    kind: "PRACTICE_READING",
                    title: "Reading",
                    status: "STARTED",
                    startedAt: null,
                    completedAt: null,
                    writingEvaluationStatus: null,
                    speakingEvaluationStatus: null,
                  },
                  {
                    id: "writing",
                    kind: "PRACTICE_WRITING",
                    title: "Writing",
                    status: "PENDING",
                    startedAt: null,
                    completedAt: null,
                    writingEvaluationStatus: "PENDING",
                    speakingEvaluationStatus: null,
                  },
                  {
                    id: "mock",
                    kind: "MOCK",
                    title: "Mock",
                    status: "COMPLETED",
                    startedAt: null,
                    completedAt: null,
                    writingEvaluationStatus: "FAILED",
                    speakingEvaluationStatus: "COMPLETED",
                  },
                ],
                total: 3,
                page: 1,
                limit: 25,
              },
            }
          : url === "/api/subscription/admin/ada"
            ? {
                version: "a".repeat(64),
                subscription: null,
                plan: {
                  periodDays: 30,
                  quotas: {
                    MOCK_WRITING: 10,
                    MOCK_SPEAKING: 10,
                    PRACTICE_AI: 120,
                  },
                },
                history: [],
              }
            : url.endsWith("/access")
              ? []
              : {
                  id: "ada",
                  name: "Ada",
                  email: "ada@example.test",
                  telegramId: "123",
                  telegramUsername: "ada",
                },
      },
    }));
    // StudentDetail gets its real route parameter from this minimal route wrapper.
    const { client } = setup();
    const { Routes, Route } = await import("react-router-dom");
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/students/ada"]}>
          <Routes>
            <Route path="/students/:id" element={<StudentDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await settle();
    expect(screen.getByText("Henüz ölçülmüyor")).toBeVisible();
    expect(screen.queryByText("Başladı")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Geçmişi göster" }));
    expect(screen.getByText("Başladı")).toBeVisible();
    expect(screen.getAllByText("Değerlendirme bekliyor")).toHaveLength(2);
    expect(screen.getByText("Değerlendirme başarısız")).toBeVisible();
    expect(screen.getByText("Hediye erişimler")).toBeVisible();
    expect(screen.getByText("Son kullanılan cihaz")).toBeVisible();
    expect(screen.getByText("Android telefon")).toBeVisible();
    expect(screen.getByText("Üyelik yok")).toBeVisible();
    expect(
      screen.queryByText("Üyelik bilgileri yüklenemedi."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Erişim ver" })).toBeVisible();
    const historyCard = screen
      .getByText("Sınav ve pratik geçmişi")
      .closest(".ant-card")!;
    expect(
      within(historyCard as HTMLElement).getAllByText("Tamamlandı"),
    ).toHaveLength(2);
  });
});
