import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { billingPackageEndpoints as ep } from "@/config/endpoint";
import BillingPackages from "./billing-packages";
import { packagePreset, type PackageTerms } from "./billing-package-form";

it("copies the configured campaign into a new paused identity without carrying historical counts", async () => {
  const original = {
    id: "original", revision: 7, salesEnabled: true, sortOrder: 3,
    activeVersionId: "published-version",
    terms: {
      ...packagePreset("MEMBERSHIP"),
      campaign: { id: "11111111-1111-4111-8111-111111111111", enabled: true, label: "İlk üyeler", userLimit: 1000 },
      discount: { kind: "AMOUNT_UZS" as const, value: 10000, startsAt: "2020-01-01T00:00:00Z", endsAt: "2099-01-01T00:00:00Z" },
    },
    campaignState: { id: "11111111-1111-4111-8111-111111111111", label: "İlk üyeler", userLimit: 1000, claimedUsers: 753, reservedUsers: 2, remainingUsers: 247, availableUsers: 245, status: "ACTIVE" },
  };
  const get = vi.spyOn(axiosPrivate, "get").mockImplementation(async (url) => {
    if (url === ep.packages) return { data: [original] };
    if (url === ep.content) return { data: { mocks: [], lessons: [] } };
    if (url === ep.settings) return { data: { revision: 1, lessonsVisible: true, defaultPackageId: "original" } };
    if (url === ep.one("original")) return { data: original };
    if (url === ep.history("original") || url === ep.history("copy")) return { data: [] };
    if (url === ep.one("copy")) return { data: { ...original, id: "copy", campaignState: null } };
    throw new Error(`Unexpected fixture request: ${url}`);
  });
  const post = vi.spyOn(axiosPrivate, "post").mockImplementation(async (url, body) => {
    expect(url).toBe(ep.packages);
    const payload = body as { terms: PackageTerms };
    return { data: { id: "copy", revision: 1, salesEnabled: false, sortOrder: 0, terms: payload.terms, campaignState: null } };
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><BillingPackages /></QueryClientProvider>);
  try {
    fireEvent.click(await screen.findByRole("button", { name: /^30 Günlük Üyelik$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Paketi kopyala" }));
    await screen.findByDisplayValue("30 Günlük Üyelik kopyası");
    expect(post).toHaveBeenCalledTimes(1);
    const payload = post.mock.calls[0][1] as { terms: PackageTerms };
    expect(payload.terms).toEqual({
      ...original.terms,
      name: "30 Günlük Üyelik kopyası",
      campaign: { ...original.terms.campaign, id: expect.any(String), enabled: false },
    });
    expect(payload.terms.campaign?.id).not.toBe(original.terms.campaign.id);
    expect(payload.terms.campaign?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(payload).not.toHaveProperty("campaignState");
    expect(screen.getByRole("checkbox", { name: /^Kampanya$/ })).not.toBeChecked();
    expect(screen.queryByText(/247 kontenjan kaldı/)).not.toBeInTheDocument();
  } finally {
    view.unmount();
    client.clear();
    get.mockRestore();
    post.mockRestore();
  }
});
