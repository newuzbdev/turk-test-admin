import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AxiosHeaders } from "axios";
import type { AxiosAdapter } from "axios";
import {
  adminAccountRequest,
  adminSubscriptionGet,
  adminSubscriptionTransport,
  writeStudentSubscription,
} from "./student-subscription-query";
const version = "a".repeat(64);
const token = (id: string) =>
  `synthetic.${btoa(JSON.stringify({ id, role: "ADMIN" }))}.synthetic`;
const state = {
  version,
  subscription: null,
  plan: {
    periodDays: 30,
    quotas: { MOCK_WRITING: 10, MOCK_SPEAKING: 10, PRACTICE_AI: 120 },
  },
  history: [],
};
let previousAdapter: typeof adminSubscriptionTransport.defaults.adapter;
let sent: Array<{
  method: unknown;
  data: unknown;
  authorization: unknown;
  withCredentials: unknown;
}>;
beforeEach(() => {
  localStorage.setItem("accessToken", token("admin-1"));
  sent = [];
  previousAdapter = adminSubscriptionTransport.defaults.adapter;
  const adapter: AxiosAdapter = async (config) => {
    sent.push({
      method: config.method,
      data: config.data,
      authorization: config.headers.get("Authorization"),
      withCredentials: config.withCredentials,
    });
    return {
      data: { success: true, data: state },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    };
  };
  adminSubscriptionTransport.defaults.adapter = adapter;
});
afterEach(() => {
  adminSubscriptionTransport.defaults.adapter = previousAdapter;
  localStorage.clear();
});
describe("privileged subscription dispatch", () => {
  it("aborts a PATCH if admin identity changes before Axios dispatch instead of sending the new admin token", async () => {
    queueMicrotask(() => localStorage.setItem("accessToken", token("admin-2")));
    const request = writeStudentSubscription("student-1", "admin-1", {
      requestId: crypto.randomUUID(),
      expectedVersion: version,
      action: "RENEW",
      reason: "Destek işlemi",
      confirmed: true,
    });
    await expect(request).rejects.toThrow("Yönetici oturumu değişti.");
    expect(sent).toEqual([]);
  });
  it("uses the captured admin Authorization and explicitly disables cookies", async () => {
    await writeStudentSubscription("student-1", "admin-1", {
      requestId: crypto.randomUUID(),
      expectedVersion: version,
      action: "RENEW",
      reason: "Destek işlemi",
      confirmed: true,
    });
    expect(sent).toEqual([
      {
        method: "patch",
        data: expect.any(String),
        authorization: `Bearer ${token("admin-1")}`,
        withCredentials: false,
      },
    ]);
  });
  it("supports captured-auth account POST requests without changing the envelope or payload", async () => {
    const body = {
      requestId: "request-1",
      userId: "student-1",
      reason: "Destek",
    };
    const result = await adminAccountRequest(
      "post",
      "/api/admin/access/grants",
      "admin-1",
      body,
    );
    expect(result).toEqual({ success: true, data: state });
    expect(sent).toEqual([
      {
        method: "post",
        data: JSON.stringify(body),
        authorization: `Bearer ${token("admin-1")}`,
        withCredentials: false,
      },
    ]);
  });
  it("applies the same dispatch guard to a private subscription GET", async () => {
    queueMicrotask(() => localStorage.setItem("accessToken", token("admin-2")));
    await expect(
      adminSubscriptionGet(
        "/api/subscription/admin",
        "admin-1",
        new AbortController().signal,
      ),
    ).rejects.toThrow("Yönetici oturumu değişti.");
    expect(sent).toEqual([]);
  });
});
