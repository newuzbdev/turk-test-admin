import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudentSubscriptionCard from "./student-subscription-card";
import { AxiosHeaders } from "axios";
import { adminSubscriptionTransport } from "./student-subscription-query";
import { useAdminSubscriptions } from "@/config/queries/subscriptions";

const api = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
vi.mock("@/config/api", () => ({ default: api }));
const version = "a".repeat(64);
const nextVersion = "b".repeat(64);
function state(active = true, revision = version) {
  return {
    version: revision,
    subscription: active
      ? {
          id: "subscription-1",
          userId: "student-1",
          status: "ACTIVE",
          periodStart: "2026-10-01T00:00:00.000Z",
          periodEnd: "2026-11-01T00:00:00.000Z",
          quotas: {
            MOCK_WRITING: { granted: 10, used: 3, remaining: 7 },
            MOCK_SPEAKING: { granted: 10, used: 2, remaining: 8 },
            PRACTICE_AI: { granted: 120, used: 20, remaining: 100 },
          },
        }
      : null,
    plan: {
      periodDays: 30,
      quotas: { MOCK_WRITING: 10, MOCK_SPEAKING: 10, PRACTICE_AI: 120 },
    },
    history: [
      {
        id: "audit-1",
        actorId: "admin-1",
        action: "RENEW",
        reason: "Destek tarafından verildi",
        occurredAt: "2026-10-01T00:00:00Z",
      },
    ],
  };
}
function admin(id: string) {
  localStorage.setItem(
    "accessToken",
    `test.${btoa(JSON.stringify({ id, role: "ADMIN" }))}.test`,
  );
  window.dispatchEvent(new StorageEvent("storage", { key: "accessToken" }));
}
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <StudentSubscriptionCard userId="student-1" />
    </QueryClientProvider>,
  );
  return { ...view, client };
}
async function open(label: string) {
  fireEvent.click(await screen.findByRole("button", { name: label }));
  return screen.getByRole("dialog");
}
function approve(dialog: HTMLElement, reason = "Öğrenciye destek verildi") {
  fireEvent.change(
    within(dialog).getByRole("textbox", { name: "İşlem notu" }),
    { target: { value: reason } },
  );
  fireEvent.click(within(dialog).getByRole("checkbox"));
}
function save(dialog: HTMLElement) {
  fireEvent.click(
    within(dialog).getByRole("button", { name: /İşlemi onayla/ }),
  );
}
beforeEach(() => {
  adminSubscriptionTransport.defaults.adapter = async (config) => {
    const response =
      config.method === "patch"
        ? await api.patch(config.url, JSON.parse(config.data), config)
        : await api.get(config.url, config);
    return {
      ...response,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    };
  };
  const computedStyle = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
    computedStyle(element),
  );
  api.get
    .mockReset()
    .mockResolvedValue({ data: { success: true, data: state() } });
  api.patch.mockReset().mockResolvedValue({
    data: { success: true, data: state(true, nextVersion) },
  });
  admin("admin-1");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("student subscription actions", () => {
  it("requires a note and explicit confirmation before starting membership, then refreshes the card and subscription list", async () => {
    api.get.mockResolvedValue({ data: { success: true, data: state(false) } });
    const { client } = mount();
    client.setQueryData(["admin-subscriptions", { page: 1 }, "admin-1"], {
      data: [],
    });
    const dialog = await open("Üyeliği başlat");
    save(dialog);
    await within(dialog).findByText("En az 3 karakterlik işlem notu girin.");
    expect(api.patch).not.toHaveBeenCalled();
    approve(dialog);
    save(dialog);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(api.patch).toHaveBeenCalledTimes(1);
    expect(api.patch.mock.calls[0][0]).toBe(
      "/api/subscription/admin/student-1",
    );
    expect(api.patch.mock.calls[0][1]).toEqual({
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      expectedVersion: version,
      action: "RENEW",
      reason: "Öğrenciye destek verildi",
      confirmed: true,
    });
    expect(api.get.mock.calls.length).toBeGreaterThan(1);
    expect(
      client.getQueryState(["admin-subscriptions", { page: 1 }, "admin-1"])
        ?.isInvalidated,
    ).toBe(true);
  });

  it("requires confirmation even when the operation note is valid", async () => {
    mount();
    const dialog = await open("Üyeliği yenile");
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "İşlem notu" }),
      { target: { value: "Geçerli işlem notu" } },
    );
    save(dialog);
    await within(dialog).findByText("İşlemin etkisini onaylayın.");
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("keeps a conflict blocked when the reload fails", async () => {
    api.patch.mockRejectedValueOnce({ response: { status: 409 } });
    mount();
    const dialog = await open("Üyeliği yenile");
    approve(dialog);
    save(dialog);
    await within(dialog).findByText(/Üyelik bilgileri değişti/);
    api.get.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Yeniden yükle" }),
    );
    await within(dialog).findByText(/Güncel üyelik yüklenemedi/);
    expect(
      within(dialog).getByRole("button", { name: /İşlemi onayla/ }),
    ).toBeDisabled();
    expect(api.patch).toHaveBeenCalledTimes(1);
  });

  it("shows an authorization failure without exposing backend response details", async () => {
    api.patch.mockRejectedValueOnce({
      response: { status: 403, data: { message: "private backend canary" } },
    });
    mount();
    const dialog = await open("Üyeliği yenile");
    approve(dialog);
    save(dialog);
    await within(dialog).findByText(
      "Bu işlem için yönetici yetkisi gerekiyor.",
    );
    expect(
      screen.queryByText(/private backend canary/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows renewal replacement warning and keeps action fields out of a renewal request", async () => {
    mount();
    const dialog = await open("Üyeliği yenile");
    expect(
      within(dialog).getByText(
        /Kullanılmamış üyelik günleri ve üyelik hakları yeni dönemle değiştirilir/,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Payme üzerinden ödeme alınmaz/),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("spinbutton")).not.toBeInTheDocument();
    approve(dialog);
    save(dialog);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch.mock.calls[0][1]).not.toHaveProperty("days");
    expect(api.patch.mock.calls[0][1]).not.toHaveProperty("writingMock");
  });

  it("extends from the current expiry, submits days only, and rejects non-integer days", async () => {
    mount();
    const dialog = await open("Süre uzat");
    const days = within(dialog).getByRole("spinbutton", {
      name: "Eklenecek gün",
    });
    fireEvent.change(days, { target: { value: "1.5" } });
    approve(dialog);
    save(dialog);
    await within(dialog).findByText("1–365 arasında tam sayı girin.");
    expect(api.patch).not.toHaveBeenCalled();
    fireEvent.change(days, { target: { value: "14" } });
    expect(within(dialog).getByText(/15.11.2026/)).toBeInTheDocument();
    save(dialog);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch.mock.calls[0][1]).toEqual({
      requestId: expect.any(String),
      expectedVersion: version,
      action: "EXTEND",
      reason: "Öğrenciye destek verildi",
      confirmed: true,
      days: 14,
    });
  });

  it("requires a positive added quota and submits the selected rights without changing the expiry", async () => {
    mount();
    const dialog = await open("Hak ekle");
    approve(dialog);
    save(dialog);
    await within(dialog).findByText("En az bir hak ekleyin.");
    expect(api.patch).not.toHaveBeenCalled();
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: "Yazma Mock hakkı" }),
      { target: { value: "4" } },
    );
    save(dialog);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch.mock.calls[0][1]).toEqual({
      requestId: expect.any(String),
      expectedVersion: version,
      action: "ADD_QUOTA",
      reason: "Öğrenciye destek verildi",
      confirmed: true,
      writingMock: 4,
      speakingMock: 0,
      practiceAi: 0,
    });
    expect(api.patch.mock.calls[0][1]).not.toHaveProperty("days");
  });

  it("blocks duplicate submits and retries an uncertain result with the same intent; changed input creates a new intent", async () => {
    let reject: (error: unknown) => void = () => {};
    api.patch
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, fail) => {
            reject = fail;
          }),
      )
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce({
        data: { success: true, data: state(true, nextVersion) },
      });
    mount();
    const dialog = await open("Hak ekle");
    approve(dialog);
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: "Yazma Mock hakkı" }),
      { target: { value: "2" } },
    );
    save(dialog);
    save(dialog);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    const first = api.patch.mock.calls[0][1];
    await act(async () => reject({ response: { status: 503 } }));
    await within(dialog).findByText(/İşlem sonucu doğrulanamadı/);
    save(dialog);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
    expect(api.patch.mock.calls[1][1]).toEqual(first);
    await within(dialog).findByText(/İşlem sonucu doğrulanamadı/);
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "İşlem notu" }),
      { target: { value: "Yeni destek işlemi" } },
    );
    save(dialog);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(3));
    expect(api.patch.mock.calls[2][1].requestId).not.toBe(first.requestId);
  });

  it("blocks stale saves after a conflict until reloading and reopening with the fresh version", async () => {
    api.patch.mockRejectedValueOnce({ response: { status: 409 } });
    mount();
    const dialog = await open("Üyeliği yenile");
    approve(dialog);
    save(dialog);
    await within(dialog).findByText(/Üyelik bilgileri değişti/);
    expect(
      within(dialog).getByRole("button", { name: "İşlemi onayla" }),
    ).toBeDisabled();
    save(dialog);
    expect(api.patch).toHaveBeenCalledTimes(1);
    api.get.mockResolvedValue({
      data: { success: true, data: state(true, nextVersion) },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Yeniden yükle" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const fresh = await open("Üyeliği yenile");
    approve(fresh);
    save(fresh);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
    expect(api.patch.mock.calls[1][1].expectedVersion).toBe(nextVersion);
    expect(api.patch.mock.calls[1][1].requestId).not.toBe(
      api.patch.mock.calls[0][1].requestId,
    );
  });

  it("keeps load failures separate from an absent subscription and disables writes until fresh data loads", async () => {
    api.get.mockRejectedValueOnce(new Error("offline"));
    mount();
    await screen.findByText("Üyelik bilgileri yüklenemedi.");
    expect(screen.queryByText("Üyelik bulunmuyor.")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Üyeliği başlat" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yeniden dene" }));
    expect(
      await screen.findByRole("button", { name: "Üyeliği yenile" }),
    ).toBeEnabled();
  });

  it("ignores a pending mutation response when the admin identity changes", async () => {
    let resolve: (value: unknown) => void = () => {};
    api.patch.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { client } = mount();
    client.setQueryData(["admin-subscriptions", {}, "admin-1"], { data: [] });
    const dialog = await open("Üyeliği yenile");
    approve(dialog);
    save(dialog);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    act(() => admin("admin-2"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await act(async () =>
      resolve({ data: { success: true, data: state(true, nextVersion) } }),
    );
    expect(
      client.getQueryState(["admin-subscriptions", {}, "admin-1"])
        ?.isInvalidated,
    ).toBe(false);
    expect(screen.queryByText("İşlem tamamlandı.")).not.toBeInTheDocument();
  });

  it("disables extend and added quota actions for an expired membership", async () => {
    const expired = state();
    expired.subscription!.status = "EXPIRED";
    api.get.mockResolvedValue({ data: { success: true, data: expired } });
    mount();
    expect(
      await screen.findByRole("button", { name: "Süre uzat" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hak ekle" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Üyeliği yenile" }),
    ).toBeEnabled();
  });
});

function SubscriptionListProbe() {
  const query = useAdminSubscriptions({
    page: 1,
    limit: 20,
    search: "",
    status: "ALL",
  });
  return (
    <div>
      {query.data?.data.map((row) => row.user.name).join(",") ??
        "Liste yükleniyor"}
    </div>
  );
}
describe("subscription query session boundaries", () => {
  it("uses no-store, excludes private subscription data from persistence, and hides a previous admin's pending list response", async () => {
    let resolve: (value: unknown) => void = () => {};
    const list = {
      data: [{ user: { name: "Önceki yönetici verisi" } }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    api.get
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValue({
        data: {
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      });
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <SubscriptionListProbe />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(api.get.mock.calls[0][1].headers).toMatchObject({
      "Cache-Control": "no-store",
    });
    const query = client
      .getQueryCache()
      .find({ queryKey: ["admin-subscriptions"], exact: false });
    expect(query?.meta?.persist).toBe(false);
    expect(query?.queryKey).toContain("admin-1");
    act(() => admin("admin-2"));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    await act(async () => resolve({ data: list }));
    expect(
      screen.queryByText("Önceki yönetici verisi"),
    ).not.toBeInTheDocument();
  });

  it("removes the previously persisted list key instead of showing it as a fresh admin list", async () => {
    api.get.mockResolvedValue({
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });
    const client = new QueryClient();
    const oldKey = [
      "admin-subscriptions",
      { page: 1, limit: 20, search: "", status: "ALL" },
    ];
    client.setQueryData(oldKey, {
      data: [{ user: { name: "Eski özel liste" } }],
    });
    render(
      <QueryClientProvider client={client}>
        <SubscriptionListProbe />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(client.getQueryData(oldKey)).toBeUndefined());
    expect(screen.queryByText("Eski özel liste")).not.toBeInTheDocument();
  });

  it("rejects a malformed student detail envelope and never treats it as an empty subscription", async () => {
    api.get.mockResolvedValueOnce({ data: { success: true, data: null } });
    mount();
    await screen.findByText("Üyelik bilgileri yüklenemedi.");
    expect(screen.queryByText("Üyelik bulunmuyor.")).not.toBeInTheDocument();
  });
});
