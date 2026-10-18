import { describe, it, expect } from "vitest";
import {
  newPackageDraft,
  packagePreset,
  validatePackageForm,
  previewPrice,
  billingError,
} from "./billing-package-form";
describe("package form", () => {
  it("independent presets cannot mutate the existing membership", () => {
    const old = packagePreset("MEMBERSHIP");
    const next = packagePreset("MEMBERSHIP");
    next.basePriceUzs = 99000;
    next.quotas.MOCK_WRITING = 20;
    expect(validatePackageForm(next)).toEqual([]);
    expect(old.basePriceUzs).toBe(59000);
    expect(old.quotas.MOCK_WRITING).toBe(10);
  });
  it("selected counted Mocks can be separate, included or add-ons", () => {
    const p = packagePreset("MOCK_PASS");
    expect(validatePackageForm(p).length).toBeGreaterThan(0);
    p.mockSelections = [
      {
        sections: [
          {
            scope: "MOCK_READING",
            targetId: "11111111-1111-4111-8111-111111111111",
          },
        ],
      },
    ];
    p.attemptLimit = 2;
    p.saleMode = "MEMBERSHIP_ADD_ON";
    expect(validatePackageForm(p)).toEqual([]);
    const m = packagePreset("MEMBERSHIP");
    m.mockSelections = p.mockSelections;
    m.attemptLimit = 2;
    expect(validatePackageForm(m)).toEqual([]);
  });
  it("practice and lesson presets do not grant Mock AI", () => {
    const p = packagePreset("PRACTICE_PASS");
    expect(p.quotas.MOCK_WRITING).toBe(0);
    expect(validatePackageForm(p)).toEqual([]);
    const l = packagePreset("LESSON_PACKAGE");
    l.lessonIds = ["11111111-1111-4111-8111-111111111111"];
    expect(validatePackageForm(l)).toEqual([]);
  });
  it("discount boundaries and invalid numbers are visible", () => {
    const p = packagePreset("MEMBERSHIP");
    p.basePriceUzs = 60000;
    p.discount = {
      kind: "PERCENT",
      value: 10,
      startsAt: "2030-01-01T00:00:00Z",
      endsAt: "2030-01-02T00:00:00Z",
    };
    expect(previewPrice(p, new Date(p.discount.startsAt))).toBe(54000);
    expect(previewPrice(p, new Date(p.discount.endsAt))).toBe(60000);
    p.discount.value = 100;
    expect(validatePackageForm(p).length).toBeGreaterThan(0);
  });
});

describe("campaign capacity errors", () => {
  it.each([
    { message: "CAMPAIGN_LIMIT_BELOW_OCCUPIED" },
    { code: "CAMPAIGN_LIMIT_BELOW_OCCUPIED" },
  ])("explains occupied capacity rather than suggesting a revision reload for %j", (data) => {
    expect(billingError({ response: { status: 409, data } })).toBe(
      "Kullanıcı sınırı, mevcut katılımcılar ve ödeme için ayrılan kontenjanların toplamından az olamaz. Sınırı artırın.",
    );
  });

  it("keeps the existing draft-preserving advice for a revision conflict", () => {
    expect(billingError({ response: { status: 409, data: { message: "BILLING_EDIT_CONFLICT" } } })).toBe(
      "Başka bir düzenleme kaydedildi. Taslağınız korunuyor; yeniden yüklemeden önce değişikliklerinizi kopyalayabilirsiniz.",
    );
  });
});

it("new lesson and Mock drafts can be edited before content is selected", () => {
  for (const kind of ["MOCK_PASS", "LESSON_PACKAGE"] as const) {
    const d = newPackageDraft(kind);
    expect(d.id).toBe("");
    expect(d.salesEnabled).toBe(false);
    expect(validatePackageForm(d.terms).length).toBeGreaterThan(0);
  }
});

it("rejects a scheduled campaign whose rounded price becomes zero",()=>{
 const p=packagePreset("MEMBERSHIP");p.basePriceUzs=1;
 p.discount={kind:"PERCENT",value:10,startsAt:"2030-01-01T00:00:00Z",endsAt:"2030-02-01T00:00:00Z"};
 expect(validatePackageForm(p)).toContain("İndirim pozitif olmalı; fiyatı sıfırlayamaz.");
});

describe("membership campaign terms", () => {
  const campaign = {
    id: "11111111-1111-4111-8111-111111111111",
    enabled: true,
    label: "Kampanya",
    userLimit: 1000,
  };
  const discounted = () => ({
    ...packagePreset("MEMBERSHIP"),
    campaign: { ...campaign },
    discount: {
      kind: "AMOUNT_UZS" as const,
      value: 10000,
      startsAt: "2030-01-01T00:00:00Z",
      endsAt: "2030-02-01T00:00:00Z",
    },
  });

  it("returns the ordinary price while paused and the configured price after resuming", () => {
    const terms = discounted();
    const now = new Date("2030-01-15T00:00:00Z");
    expect(previewPrice(terms, now)).toBe(49000);
    terms.campaign.enabled = false;
    expect(previewPrice(terms, now)).toBe(59000);
    terms.campaign.enabled = true;
    expect(previewPrice(terms, now)).toBe(49000);
    expect(terms.campaign.id).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("requires a discount only for an enabled campaign", () => {
    const terms = { ...packagePreset("MEMBERSHIP"), campaign: { ...campaign } };
    expect(validatePackageForm(terms)).toContain("Kampanya için zamanlı indirim tanımlayın.");
    terms.campaign.enabled = false;
    expect(validatePackageForm(terms)).toEqual([]);
  });

  it("accepts unlimited campaigns and rejects invalid identity, label, or user caps", () => {
    expect(validatePackageForm({ ...discounted(), campaign: { ...campaign, userLimit: null } })).toEqual([]);
    for (const patch of [
      { id: "not-a-uuid" },
      { label: " " },
      { label: "a".repeat(41) },
      { userLimit: 0 },
      { userLimit: 1.5 },
      { userLimit: 1000001 },
    ]) {
      expect(validatePackageForm({ ...discounted(), campaign: { ...campaign, ...patch } }).length).toBeGreaterThan(0);
    }
  });

  it("retains legacy timed discounts and disallows campaigns on other package kinds", () => {
    const legacy = discounted();
    const { campaign: _campaign, ...terms } = legacy;
    expect(validatePackageForm(terms)).toEqual([]);
    expect(previewPrice(terms, new Date("2030-01-15T00:00:00Z"))).toBe(49000);
    expect(validatePackageForm({ ...discounted(), kind: "PRACTICE_PASS" }).length).toBeGreaterThan(0);
  });
});
