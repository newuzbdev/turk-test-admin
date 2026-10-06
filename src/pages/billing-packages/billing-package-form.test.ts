import { describe, it, expect } from "vitest";
import {
  newPackageDraft,
  packagePreset,
  validatePackageForm,
  previewPrice,
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
