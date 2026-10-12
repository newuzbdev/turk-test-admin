import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { PropsWithChildren } from "react";
import {
  accessGet,
  accessWrite,
  useTargetAccess,
  type AccessRecord,
} from "./access";
import {
  usePublishedAccessTargets,
  useStudent,
  useStudentAccess,
  useStudents,
} from "./students";
import { adminSubscriptionTransport } from "@/pages/students/student-subscription-query";
import AccessGrantDialog from "@/components/access/AccessGrantDialog";
import AccessRecordActions from "@/components/access/AccessRecordActions";

const shared = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/config/api", () => ({ default: shared }));
const originalAdapter = adminSubscriptionTransport.defaults.adapter;
const calls: InternalAxiosRequestConfig[] = [];
const studentId = "f3245f75-7cf6-42f4-9d28-4cfa415f5624";
const record: AccessRecord = {
  id: "grant",
  scope: "PLATFORM",
  revision: 1,
  startsAt: "2027-01-01T00:00:00Z",
  endsAt: "2099-01-01T00:00:00Z",
  revokedAt: null,
  writingMockLimit: 10,
  speakingMockLimit: 10,
  practiceAiLimit: 120,
};
function login(id = "admin-a", role = "ADMIN", notify = true) {
  localStorage.setItem(
    "accessToken",
    `synthetic.${btoa(JSON.stringify({ id, role }))}.signature`,
  );
  if (notify)
    window.dispatchEvent(new StorageEvent("storage", { key: "accessToken" }));
}
function responseData(url: string, adminId = "admin-a") {
  const identity = {
    id: studentId,
    name: `${adminId} student`,
    email: null,
    telegramId: null,
    telegramUsername: null,
  };
  if (url === "/api/access/config") return { enabled: true };
  if (url === "/api/admin/students")
    return { items: [identity], total: 1, page: 1, limit: 25 };
  if (url === `/api/admin/students/${studentId}`) return identity;
  if (url === "/api/admin/students/access-targets")
    return {
      items: [
        {
          id: "target",
          title: `${adminId} target`,
          scope: "MOCK_WRITING",
          buckets: ["MOCK_WRITING"],
        },
      ],
      total: 1,
    };
  return [{ ...record, reason: `${adminId} gift` }];
}
function reply(config: InternalAxiosRequestConfig, data: unknown) {
  return {
    data: { success: true, data },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 300_000, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
beforeEach(() => {
  calls.length = 0;
  login();
  shared.get.mockReset().mockImplementation(async (url: string) => ({
    data: { success: true, data: responseData(url) },
  }));
  shared.post
    .mockReset()
    .mockResolvedValue({ data: { success: true, data: record } });
  shared.patch
    .mockReset()
    .mockResolvedValue({ data: { success: true, data: record } });
  adminSubscriptionTransport.defaults.adapter = async (config) => {
    calls.push(config);
    const token = String(config.headers.Authorization).split(".")[1];
    const adminId = JSON.parse(atob(token)).id;
    return reply(config, responseData(config.url!, adminId));
  };
  const original = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
    original(element),
  );
});
afterEach(() => {
  cleanup();
  adminSubscriptionTransport.defaults.adapter = originalAdapter;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("private student and access reads", () => {
  const cases: Array<
    [string, () => { data: unknown }, (data: unknown) => string | undefined]
  > = [
    [
      "directory",
      () => useStudents({ q: "", page: 1, limit: 25 }),
      (data: unknown) =>
        (data as { items: { name: string }[] })?.items[0]?.name,
    ],
    [
      "identity",
      () => useStudent(studentId),
      (data: unknown) => (data as { name: string })?.name,
    ],
    [
      "gift rights",
      () => useStudentAccess(studentId),
      (data: unknown) => (data as AccessRecord[])?.[0]?.reason,
    ],
    [
      "target picker",
      () => usePublishedAccessTargets("MOCK_WRITING", ""),
      (data: unknown) =>
        (data as { items: { title: string }[] })?.items[0]?.title,
    ],
    [
      "public policies",
      () =>
        useTargetAccess("public-access", {
          scope: "MOCK_WRITING",
          targetId: "target",
        }),
      (data: unknown) => (data as AccessRecord[])?.[0]?.reason,
    ],
    [
      "campaigns",
      () =>
        useTargetAccess("share-links", {
          scope: "MOCK_WRITING",
          targetId: "target",
        }),
      (data: unknown) => (data as AccessRecord[])?.[0]?.reason,
    ],
  ];
  for (const [name, hook, label] of cases)
    it(`isolates ${name} from a previous administrator's fresh in-memory cache`, async () => {
      const { client, wrapper } = setup();
      const view = renderHook(hook, { wrapper });
      await waitFor(() =>
        expect(label(view.result.current.data)).toMatch(/^admin-a /),
      );
      const initial = client
        .getQueryCache()
        .getAll()
        .find((q) => q.queryKey[1] !== "access-config")!;
      expect(initial.queryKey).toContain("admin-a");
      expect(JSON.stringify(initial.queryKey)).not.toContain("synthetic.");
      expect(initial.meta?.persist).toBe(false);
      expect(initial.options.gcTime).toBe(0);
      let resolve!: (data: unknown) => void;
      adminSubscriptionTransport.defaults.adapter = (config) => {
        calls.push(config);
        return new Promise((done) => {
          resolve = (data) => done(reply(config, data));
        });
      };
      act(() => login("admin-b"));
      expect(view.result.current.data).toBeUndefined();
      await waitFor(() => expect(calls).toHaveLength(2));
      expect(calls[1].headers.Authorization).toContain(
        localStorage.getItem("accessToken"),
      );
      await act(async () => resolve(responseData(calls[1].url!, "admin-b")));
      await waitFor(() =>
        expect(label(view.result.current.data)).toMatch(/^admin-b /),
      );
      expect(
        shared.get.mock.calls.every(([url]) => url === "/api/access/config"),
      ).toBe(true);
    });
  it("aborts an old identity request and never displays its delayed response after switching admin", async () => {
    let resolveOld!: () => void;
    adminSubscriptionTransport.defaults.adapter = (config) => {
      calls.push(config);
      if (calls.length === 1)
        return new Promise((done) => {
          resolveOld = () => done(reply(config, responseData(config.url!)));
        });
      return Promise.resolve(
        reply(config, responseData(config.url!, "admin-b")),
      );
    };
    const { wrapper } = setup();
    const view = renderHook(() => useStudent(studentId), { wrapper });
    await waitFor(() => expect(calls).toHaveLength(1));
    act(() => login("admin-b"));
    await waitFor(() =>
      expect(view.result.current.data?.name).toBe("admin-b student"),
    );
    expect(calls[0].signal?.aborted).toBe(true);
    await act(async () => resolveOld());
    expect(view.result.current.data?.name).toBe("admin-b student");
  });
  it("rejects a delayed private GET response after the administrator changes", async () => {
    let release!: () => void;
    shared.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          release = () => done({ data: { success: true, data: record } });
        }),
    );
    adminSubscriptionTransport.defaults.adapter = (config) =>
      new Promise((done) => {
        release = () => done(reply(config, record));
      });
    const pending = accessGet("/api/admin/access/grants");
    const rejected = expect(pending).rejects.toThrow(
      "Yönetici oturumu değişti.",
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    login("admin-b", "ADMIN", false);
    release();
    await rejected;
  });
  it("keeps the public rollout config readable without an administrator session", async () => {
    localStorage.clear();
    expect(await accessGet("/api/access/config")).toEqual({ enabled: true });
    expect(calls).toHaveLength(0);
  });
  it("keeps a shared policy request alive while another current-session consumer still needs it", async () => {
    let release!: () => void;
    adminSubscriptionTransport.defaults.adapter = (config) => {
      calls.push(config);
      return new Promise((done) => {
        release = () =>
          done(reply(config, [{ ...record, reason: "Current policy" }]));
      });
    };
    const { wrapper } = setup();
    const usePolicyQuery = () =>
      useTargetAccess("public-access", {
        scope: "MOCK_WRITING",
        targetId: "target",
      });
    const first = renderHook(usePolicyQuery, { wrapper });
    const second = renderHook(usePolicyQuery, { wrapper });
    await waitFor(() => expect(calls).toHaveLength(1));
    first.unmount();
    expect(calls[0].signal?.aborted).toBe(false);
    await act(async () => release());
    await waitFor(() =>
      expect(second.result.current.data?.[0].reason).toBe("Current policy"),
    );
  });
});

describe("gift write identity at the actual Axios dispatch boundary", () => {
  it("rejects a queued write if the administrator changes before dispatch", async () => {
    const pending = accessWrite(
      "/api/admin/access/grants/grant",
      { expectedRevision: 1 },
      "patch",
    );
    const rejected = expect(pending).rejects.toThrow(
      "Yönetici oturumu değişti.",
    );
    login("admin-b", "ADMIN", false);
    await rejected;
    expect(calls).toHaveLength(0);
    expect(shared.patch).not.toHaveBeenCalled();
  });
  it("uses captured Authorization and no cookies or automatic 401 replay", async () => {
    adminSubscriptionTransport.defaults.adapter = async (config) => {
      calls.push(config);
      throw new AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        {},
        { ...reply(config, null), status: 401 },
      );
    };
    await expect(
      accessWrite("/api/admin/access/grants", { userId: studentId }),
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.Authorization).toBe(
      `Bearer ${localStorage.getItem("accessToken")}`,
    );
    expect(calls[0].headers["Cache-Control"]).toBe("no-store");
    expect(calls[0].withCredentials).toBe(false);
    expect(shared.post).not.toHaveBeenCalled();
  });
});

describe("gift forms belong to the administrator who opened them", () => {
  it("refuses a previously opened grant before the same-tab identity observer runs", async () => {
    const { wrapper } = setup();
    const close = vi.fn();
    render(<AccessGrantDialog userId={studentId} onClose={close} />, {
      wrapper,
    });
    const save = screen.getByRole("button", { name: "Kaydet" });
    login("admin-b", "ADMIN", false);
    fireEvent.click(save);
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(calls.filter((c) => c.method !== "get")).toHaveLength(0);
    expect(shared.post).not.toHaveBeenCalled();
  });
  it("hides stale gift forms on a storage event and blocks their public revoke action", async () => {
    const { wrapper } = setup();
    const close = vi.fn();
    render(
      <AccessGrantDialog
        kind="public"
        record={{ ...record, scope: "MOCK_WRITING", targetId: "target" }}
        onClose={close}
      />,
      { wrapper },
    );
    const revoke = screen.getByRole("button", {
      name: "Herkese açık erişimi iptal et",
    });
    login("admin-b", "ADMIN", false);
    fireEvent.click(revoke);
    act(() =>
      window.dispatchEvent(new StorageEvent("storage", { key: "accessToken" })),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(calls.filter((c) => c.method !== "get")).toHaveLength(0);
  });
  it("blocks an already open revoke confirmation and copy callback after an identity switch", async () => {
    const { wrapper } = setup();
    const copy = vi.fn();
    render(<AccessRecordActions kind="grant" record={record} copy={copy} />, {
      wrapper,
    });
    fireEvent.click(screen.getByRole("button", { name: "İptal et" }));
    const confirm = within(screen.getByRole("dialog")).getByRole("button", {
      name: "İptal et",
    });
    const copyButton = screen.getByRole("button", {
      name: "Bağlantıyı kopyala",
    });
    login("admin-b", "ADMIN", false);
    fireEvent.click(confirm);
    fireEvent.click(copyButton);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(copy).not.toHaveBeenCalled();
    expect(calls.filter((c) => c.method !== "get")).toHaveLength(0);
    expect(shared.post).not.toHaveBeenCalled();
  });
});
