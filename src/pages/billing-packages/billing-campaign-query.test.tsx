import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { billingPackageEndpoints } from "@/config/endpoint";
import { useBillingCampaignState } from "@/config/queries/billing-packages";
import { packagePreset } from "./billing-package-form";

afterEach(() => {
  cleanup();
  focusManager.setFocused(undefined);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("reads changing campaign counts every 15 seconds only while visible, and refreshes on focus", async () => {
  vi.useFakeTimers();
  focusManager.setFocused(true);
  const state = {
    id: "11111111-1111-4111-8111-111111111111", label: "Kampanya", userLimit: 1000,
    claimedUsers: 753, reservedUsers: 2, remainingUsers: 247, availableUsers: 245, status: "ACTIVE",
  };
  let reads = 0;
  const get = vi.spyOn(axiosPrivate, "get").mockImplementation(async (url) => {
    expect(url).toBe(billingPackageEndpoints.one("package"));
    reads += 1;
    return { data: { id: "package", revision: 1, terms: packagePreset("MEMBERSHIP"), salesEnabled: false, sortOrder: 0,
      campaignState: { ...state, claimedUsers: 752 + reads, remainingUsers: 248 - reads, availableUsers: 246 - reads } } };
  });
  const post = vi.spyOn(axiosPrivate, "post"), patch = vi.spyOn(axiosPrivate, "patch");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => useBillingCampaignState("package"), { wrapper });
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(result.current.data?.remainingUsers).toBe(247);
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(result.current.data?.remainingUsers).toBe(246);
  act(() => focusManager.setFocused(false));
  await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
  expect(get).toHaveBeenCalledTimes(2);
  await act(async () => { focusManager.setFocused(true); await vi.advanceTimersByTimeAsync(1); });
  expect(result.current.data?.remainingUsers).toBe(245);
  expect(post).not.toHaveBeenCalled();
  expect(patch).not.toHaveBeenCalled();
  unmount();
  client.clear();
});

it("does not request a counter for an unsaved or non-membership package", async () => {
  const get = vi.spyOn(axiosPrivate, "get");
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => useBillingCampaignState(undefined), { wrapper });
  expect(result.current.fetchStatus).toBe("idle");
  expect(get).not.toHaveBeenCalled();
  unmount();
  client.clear();
});
