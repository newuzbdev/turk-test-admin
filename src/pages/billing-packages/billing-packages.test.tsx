import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import BillingPackageEditor from "./billing-package-editor";
import { packagePreset } from "./billing-package-form";
it("a stale save keeps the owner draft and never becomes a success", async () => {
  const onSave = vi.fn().mockRejectedValue({ response: { status: 409 } }),
    onPublish = vi.fn();
  render(
    <BillingPackageEditor
      draft={{
        id: "package",
        revision: 1,
        terms: packagePreset("MEMBERSHIP"),
        salesEnabled: true,
        sortOrder: 0,
      }}
      content={{ mocks: [], lessons: [] }}
      onSave={onSave}
      onPublish={onPublish}
      onReload={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Paket adı"), {
    target: { value: "Yeni paket" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Başka bir düzenleme",
  );
  expect(screen.getByLabelText("Paket adı")).toHaveValue("Yeni paket");
  expect(onPublish).not.toHaveBeenCalled();
});

const campaign = {
  id: "11111111-1111-4111-8111-111111111111",
  enabled: true,
  label: "İlk üyeler",
  userLimit: 1000,
};
const campaignState = {
  id: campaign.id,
  label: campaign.label,
  userLimit: 1000,
  claimedUsers: 753,
  reservedUsers: 2,
  remainingUsers: 247,
  availableUsers: 245,
  status: "ACTIVE" as const,
};
const membershipDraft = () => ({
  id: "package",
  revision: 1,
  terms: {
    ...packagePreset("MEMBERSHIP"),
    campaign: { ...campaign },
    discount: {
      kind: "AMOUNT_UZS" as const,
      value: 10000,
      startsAt: "2020-01-01T00:00:00Z",
      endsAt: "2099-01-01T00:00:00Z",
    },
  },
  campaignState,
  salesEnabled: false,
  sortOrder: 0,
});

it("creates an editable campaign draft without saving, publishing, or inventing a discount", () => {
  const onSave = vi.fn(), onPublish = vi.fn();
  render(<BillingPackageEditor draft={{ ...membershipDraft(), terms: packagePreset("MEMBERSHIP") }} content={{ mocks: [], lessons: [] }} onSave={onSave} onPublish={onPublish} onReload={vi.fn()} />);
  fireEvent.click(screen.getByRole("checkbox", { name: /^Kampanya$/ }));
  expect(screen.getByLabelText("Kampanya adı")).toHaveValue("Kampanya");
  expect(screen.getByLabelText("Kullanıcı sayısı")).toHaveValue("1000");
  expect(screen.getByRole("checkbox", { name: "Zamanlı indirim" })).not.toBeChecked();
  expect(screen.getByLabelText("Fiyat (som)")).toHaveValue("59000");
  expect(onSave).not.toHaveBeenCalled();
  expect(onPublish).not.toHaveBeenCalled();
});

it("pauses and resumes the same campaign and supports an unlimited cap", async () => {
  const draft = membershipDraft();
  const onSave = vi.fn(async (_draft, terms) => ({ ...draft, revision: 2, terms }));
  const onPublish = vi.fn();
  render(<BillingPackageEditor draft={draft} content={{ mocks: [], lessons: [] }} onSave={onSave} onPublish={onPublish} onReload={vi.fn()} />);
  const preview = screen.getByRole("region", { name: "Paket önizlemesi" });
  expect(within(preview).getByText("49.000 som")).toBeInTheDocument();
  expect(within(preview).getByText("59.000 som")).toHaveStyle({ textDecoration: "line-through" });
  fireEvent.click(screen.getByRole("checkbox", { name: /^Kampanya$/ }));
  expect(within(preview).queryByText("49.000 som")).not.toBeInTheDocument();
  expect(screen.getByText(/247 kontenjan kaldı/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  await screen.findByText("Taslak kaydedildi; yeni satışlar henüz değişmedi.");
  expect(onSave.mock.calls[0][1].campaign).toEqual({ ...campaign, enabled: false });
  fireEvent.click(screen.getByRole("checkbox", { name: /^Kampanya$/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /^Kullanıcı sınırı$/ }));
  fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  await screen.findByText("Taslak kaydedildi; yeni satışlar henüz değişmedi.");
  expect(onSave.mock.calls[1][1].campaign).toEqual({ ...campaign, userLimit: null });
  expect(onPublish).not.toHaveBeenCalled();
});

it("updates the read-only counter without replacing unsaved fields", () => {
  const draft = membershipDraft();
  const props = { draft, content: { mocks: [], lessons: [] }, onSave: vi.fn(), onPublish: vi.fn(), onReload: vi.fn() };
  const { rerender } = render(<BillingPackageEditor {...props} campaignState={campaignState} />);
  fireEvent.change(screen.getByLabelText("Paket adı"), { target: { value: "Kaydedilmemiş paket" } });
  fireEvent.change(screen.getByLabelText("Kampanya adı"), { target: { value: "Kaydedilmemiş kampanya" } });
  expect(screen.getByText(/2 kontenjan ödeme için ayrıldı/)).toBeInTheDocument();
  rerender(<BillingPackageEditor {...props} campaignState={{ ...campaignState, claimedUsers: 754, remainingUsers: 246, availableUsers: 244 }} />);
  expect(screen.getByText(/246 kontenjan kaldı/)).toBeInTheDocument();
  expect(screen.getByLabelText("Paket adı")).toHaveValue("Kaydedilmemiş paket");
  expect(screen.getByLabelText("Kampanya adı")).toHaveValue("Kaydedilmemiş kampanya");
  expect(props.onSave).not.toHaveBeenCalled();
});

it.each([
  ["RESERVED", "Son kontenjanlar ödeme aşamasında"],
  ["SOLD_OUT", "Kampanya kontenjanı doldu"],
] as const)("explains the %s inventory state from the server", (status, message) => {
  render(<BillingPackageEditor draft={membershipDraft()} campaignState={{ ...campaignState, status }} content={{ mocks: [], lessons: [] }} onSave={vi.fn()} onPublish={vi.fn()} onReload={vi.fn()} />);
  expect(screen.getByText(message)).toBeInTheDocument();
});

it("does not add campaign controls to practice packages", () => {
  render(<BillingPackageEditor draft={{ ...membershipDraft(), terms: packagePreset("PRACTICE_PASS") }} content={{ mocks: [], lessons: [] }} onSave={vi.fn()} onPublish={vi.fn()} onReload={vi.fn()} />);
  expect(screen.queryByRole("checkbox", { name: /^Kampanya$/ })).not.toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "Zamanlı indirim" })).toBeInTheDocument();
});
