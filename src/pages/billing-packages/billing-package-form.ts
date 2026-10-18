export type PackageKind =
  "MEMBERSHIP" | "MOCK_PASS" | "PRACTICE_PASS" | "LESSON_PACKAGE";
export type PackageScope =
  | "MOCK_READING"
  | "MOCK_LISTENING"
  | "MOCK_WRITING"
  | "MOCK_SPEAKING"
  | "PRACTICE_READING"
  | "PRACTICE_LISTENING"
  | "PRACTICE_WRITING"
  | "PRACTICE_SPEAKING";
export type MockSelection = {
  packageId?: string;
  sections: { scope: PackageScope; targetId: string }[];
};
export type BillingCampaign = {
  id: string;
  enabled: boolean;
  label: string;
  userLimit: number | null;
};
export type BillingCampaignState = {
  id: string;
  label: string;
  userLimit: number | null;
  claimedUsers: number;
  reservedUsers: number;
  remainingUsers: number | null;
  availableUsers: number | null;
  status: "ACTIVE" | "PAUSED" | "SCHEDULED" | "ENDED" | "SOLD_OUT" | "RESERVED" | "ALREADY_USED";
};
export type PackageTerms = {
  kind: PackageKind;
  saleMode: "STANDALONE" | "MEMBERSHIP_ADD_ON" | "BOTH";
  name: string;
  description: string;
  basePriceUzs: number;
  periodDays: number | null;
  quotas: { MOCK_WRITING: number; MOCK_SPEAKING: number; PRACTICE_AI: number };
  lessonIds: string[];
  mockSelections: MockSelection[];
  standardMockAccess: boolean;
  practiceScopes: PackageScope[];
  attemptLimit: number;
  validityDays: number | null;
  campaign?: BillingCampaign | null;
  discount: null | {
    kind: "PERCENT" | "AMOUNT_UZS";
    value: number;
    startsAt: string;
    endsAt: string;
  };
};
export type PackageDraft = {
  id: string;
  revision: number;
  terms: PackageTerms;
  salesEnabled: boolean;
  sortOrder: number;
  activeVersionId?: string | null;
  campaignState?: BillingCampaignState | null;
};
export type ContentOptions = {
  mocks: { label: string; selection: MockSelection }[];
  lessons: { id: string; title: string }[];
};
export function packagePreset(kind: PackageKind): PackageTerms {
  const membership = kind === "MEMBERSHIP",
    practice = kind === "PRACTICE_PASS";
  return {
    kind,
    saleMode: "STANDALONE",
    name: membership
      ? "30 Günlük Üyelik"
      : kind === "MOCK_PASS"
        ? "Mock Test Paketi"
        : practice
          ? "Pratik Paketi"
          : "Ders Paketi",
    description: "",
    basePriceUzs: membership ? 59000 : 20000,
    periodDays: kind === "MOCK_PASS" ? null : 30,
    quotas: {
      MOCK_WRITING: membership ? 10 : 0,
      MOCK_SPEAKING: membership ? 10 : 0,
      PRACTICE_AI: membership || practice ? 120 : 0,
    },
    lessonIds: [],
    mockSelections: [],
    standardMockAccess: membership,
    practiceScopes:
      membership || practice
        ? [
            "PRACTICE_READING",
            "PRACTICE_LISTENING",
            "PRACTICE_WRITING",
            "PRACTICE_SPEAKING",
          ]
        : [],
    attemptLimit: kind === "MOCK_PASS" ? 1 : 0,
    validityDays: null,
    discount: null,
  };
}
export function validatePackageForm(t: PackageTerms): string[] {
  const errors: string[] = [];
  const integer = (n: number, min: number, max: number) =>
    Number.isSafeInteger(n) && n >= min && n <= max;
  if (!t.name.trim() || t.name.length > 120)
    errors.push("Paket adı 1–120 karakter olmalı.");
  if (t.description.length > 2000)
    errors.push("Açıklama en fazla 2.000 karakter olmalı.");
  if (!integer(t.basePriceUzs, 1, 2147483647))
    errors.push("Fiyat pozitif tam som olmalı.");
  if (t.kind !== "MOCK_PASS" && !integer(t.periodDays ?? 0, 1, 3650))
    errors.push("Süre 1–3.650 gün olmalı.");
  if (t.validityDays !== null && !integer(t.validityDays, 1, 3650))
    errors.push("Mock geçerliliği 1–3.650 gün olmalı.");
  if (Object.values(t.quotas).some((n) => !integer(n, 0, 100000)))
    errors.push("Hak sayıları 0–100.000 tam sayı olmalı.");
  if (
    !integer(t.attemptLimit, 0, 100000) ||
    !!t.attemptLimit !== !!t.mockSelections.length
  )
    errors.push("Mock çözme hakkı ve sınav seçimi birlikte gerekli.");
  if (t.kind === "MOCK_PASS" && (!t.attemptLimit || !t.mockSelections.length))
    errors.push("En az bir sınav seçin.");
  if (t.kind === "LESSON_PACKAGE" && !t.lessonIds.length)
    errors.push("En az bir ders seçin.");
  if (t.campaign) {
    const campaign = t.campaign;
    if (t.kind !== "MEMBERSHIP") errors.push("Kampanya yalnız üyelik paketlerinde kullanılabilir.");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaign.id))
      errors.push("Kampanya kimliği geçerli olmalı.");
    if (!campaign.label.trim() || campaign.label.length > 40)
      errors.push("Kampanya adı 1–40 karakter olmalı.");
    if (campaign.userLimit !== null && !integer(campaign.userLimit, 1, 1000000))
      errors.push("Kullanıcı sınırı 1–1.000.000 tam sayı olmalı.");
    if (campaign.enabled && !t.discount)
      errors.push("Kampanya için zamanlı indirim tanımlayın.");
  }
  if (t.discount) {
    const d = t.discount;
    const discounted = d.kind === "PERCENT"
      ? Math.floor(t.basePriceUzs * (100 - d.value) / 100)
      : t.basePriceUzs - d.value;
    if (!integer(d.value, 1, d.kind === "PERCENT" ? 99 : t.basePriceUzs - 1) || discounted < 1)
      errors.push("İndirim pozitif olmalı; fiyatı sıfırlayamaz.");
    if (
      !Number.isFinite(Date.parse(d.startsAt)) ||
      !Number.isFinite(Date.parse(d.endsAt)) ||
      Date.parse(d.endsAt) <= Date.parse(d.startsAt)
    )
      errors.push("İndirim başlangıcı ve bitişi geçerli olmalı.");
  }
  return errors;
}
export function previewPrice(t: PackageTerms, now = new Date()) {
  if (
    (t.kind === "MEMBERSHIP" && t.campaign?.enabled === false) ||
    !t.discount ||
    +now < Date.parse(t.discount.startsAt) ||
    +now >= Date.parse(t.discount.endsAt)
  )
    return t.basePriceUzs;
  return t.discount.kind === "PERCENT"
    ? Math.floor((t.basePriceUzs * (100 - t.discount.value)) / 100)
    : t.basePriceUzs - t.discount.value;
}
export function mockChoiceKey(s: MockSelection) {
  return JSON.stringify({
    packageId: s.packageId,
    sections: [...s.sections].sort((a, b) => a.scope.localeCompare(b.scope)),
  });
}

export function billingError(error: unknown) {
  const response = (error as {
    response?: { status?: number; data?: { code?: unknown; message?: unknown } };
  })?.response;
  if (
    response?.status === 409 &&
    (response.data?.code === "CAMPAIGN_LIMIT_BELOW_OCCUPIED" ||
      response.data?.message === "CAMPAIGN_LIMIT_BELOW_OCCUPIED")
  )
    return "Kullanıcı sınırı, mevcut katılımcılar ve ödeme için ayrılan kontenjanların toplamından az olamaz. Sınırı artırın.";
  return response?.status === 409
    ? "Başka bir düzenleme kaydedildi. Taslağınız korunuyor; yeniden yüklemeden önce değişikliklerinizi kopyalayabilirsiniz."
    : error instanceof Error
      ? error.message
      : "İşlem tamamlanamadı. Yeniden deneyin.";
}

export function newPackageDraft(kind: PackageKind): PackageDraft {
  return {
    id: "",
    revision: 0,
    terms: packagePreset(kind),
    salesEnabled: false,
    sortOrder: 0,
  };
}
