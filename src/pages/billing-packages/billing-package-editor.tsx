import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  Card,
} from "antd";
import { localAccessInput, parseAccessInput } from "@/utils/access-time";
import {
  billingError,
  validatePackageForm,
  mockChoiceKey,
  type ContentOptions,
  type PackageDraft,
  type PackageScope,
  type PackageTerms,
} from "./billing-package-form";
import BillingPackagePreview from "./billing-package-preview";
const practiceOptions = [
  { value: "PRACTICE_READING", label: "Okuma" },
  { value: "PRACTICE_LISTENING", label: "Dinleme" },
  { value: "PRACTICE_WRITING", label: "Yazma" },
  { value: "PRACTICE_SPEAKING", label: "Konuşma" },
];

export default function BillingPackageEditor({
  draft,
  content,
  onSave,
  onPublish,
  onReload,
}: {
  draft: PackageDraft;
  content: ContentOptions;
  onSave: (draft: PackageDraft, terms: PackageTerms) => Promise<PackageDraft>;
  onPublish: (draft: PackageDraft) => Promise<PackageDraft>;
  onReload: () => void;
}) {
  const [current, setCurrent] = useState(draft),
    [terms, setTerms] = useState(() => structuredClone(draft.terms)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const dirty = JSON.stringify(terms) !== JSON.stringify(current.terms),
    canComponents = terms.kind === "MEMBERSHIP";
  const edit = (patch: Partial<PackageTerms>) => {
    if (busy) return;
    setTerms((old) => ({ ...old, ...patch }));
    setNotice("");
  };
  async function perform(publish: boolean) {
    const issues = validatePackageForm(terms);
    if (issues.length) {
      setError(issues.join(" "));
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = publish
        ? await onPublish(current)
        : await onSave(current, terms);
      setCurrent(updated);
      setTerms(structuredClone(updated.terms));
      setNotice(
        publish
          ? "Paket yayımlandı."
          : "Taslak kaydedildi; yeni satışlar henüz değişmedi.",
      );
    } catch (e) {
      setError(billingError(e));
    } finally {
      setBusy(false);
    }
  }
  const quota = (key: keyof PackageTerms["quotas"], label: string) => (
    <label style={{ display: "grid", gap: 5 }}>
      {label}
      <InputNumber
        aria-label={label}
        min={0}
        max={100000}
        value={terms.quotas[key]}
        onChange={(n) => edit({ quotas: { ...terms.quotas, [key]: n ?? 0 } })}
      />
    </label>
  );
  return (
    <div className="billing-package-editor">
      <Card title="Paket taslağı">
        {error && (
          <Alert
            type="error"
            role="alert"
            message={error}
            action={<Button onClick={onReload}>Yeniden yükle</Button>}
            style={{ marginBottom: 16 }}
          />
        )}
        {notice && (
          <Alert
            type="success"
            role="status"
            message={notice}
            style={{ marginBottom: 16 }}
          />
        )}
        <fieldset
          disabled={busy}
          style={{ border: 0, padding: 0, display: "grid", gap: 16 }}
        >
          <label>
            Paket adı
            <Input
              aria-label="Paket adı"
              value={terms.name}
              maxLength={120}
              onChange={(e) => edit({ name: e.target.value })}
            />
          </label>
          <label>
            Açıklama
            <Input.TextArea
              aria-label="Açıklama"
              value={terms.description}
              maxLength={2000}
              onChange={(e) => edit({ description: e.target.value })}
            />
          </label>
          <Space wrap>
            <label>
              Fiyat (som)
              <br />
              <InputNumber
                aria-label="Fiyat (som)"
                min={1}
                max={2147483647}
                value={terms.basePriceUzs}
                onChange={(n) => edit({ basePriceUzs: n ?? 0 })}
              />
            </label>
            {terms.kind !== "MOCK_PASS" && (
              <label>
                Süre (gün)
                <br />
                <InputNumber
                  aria-label="Süre (gün)"
                  min={1}
                  max={3650}
                  value={terms.periodDays}
                  onChange={(n) => edit({ periodDays: n ?? 0 })}
                />
              </label>
            )}
            {terms.kind === "MOCK_PASS" && (
              <label>
                Geçerlilik (gün, boş = süre sınırı yok)
                <br />
                <InputNumber
                  aria-label="Mock geçerlilik"
                  min={1}
                  max={3650}
                  value={terms.validityDays}
                  onChange={(n) => edit({ validityDays: n })}
                />
              </label>
            )}
          </Space>
          {terms.kind !== "MEMBERSHIP" && (
            <label>
              Satış şekli
              <Select
                aria-label="Satış şekli"
                style={{ width: "100%" }}
                value={terms.saleMode}
                onChange={(saleMode) => edit({ saleMode })}
                options={[
                  { value: "STANDALONE", label: "Bağımsız paket" },
                  {
                    value: "MEMBERSHIP_ADD_ON",
                    label: "Yalnız aktif üyeye ek paket",
                  },
                  { value: "BOTH", label: "Bağımsız ve ek paket" },
                ]}
              />
            </label>
          )}
          {canComponents && (
            <Checkbox
              checked={terms.standardMockAccess}
              onChange={(e) => edit({ standardMockAccess: e.target.checked })}
            >
              Standart Mock erişimi (dahil sayılı sınavlar hariç)
            </Checkbox>
          )}
          {canComponents && (
            <Space wrap>
              {quota("MOCK_WRITING", "Yazma Mock AI")}
              {quota("MOCK_SPEAKING", "Konuşma Mock AI")}
            </Space>
          )}
          {(canComponents || terms.kind === "PRACTICE_PASS") && (
            <>
              <label>
                Dahil Pratik becerileri
                <Select
                  aria-label="Dahil Pratik becerileri"
                  mode="multiple"
                  style={{ width: "100%" }}
                  value={terms.practiceScopes}
                  onChange={(practiceScopes: PackageScope[]) =>
                    edit({ practiceScopes })
                  }
                  options={practiceOptions}
                />
              </label>
              {quota("PRACTICE_AI", "Ortak Pratik AI")}
            </>
          )}
          {(canComponents || terms.kind === "MOCK_PASS") && (
            <>
              <label>
                Sayılı Mock sınavları
                <Select
                  aria-label="Sayılı Mock sınavları"
                  mode="multiple"
                  style={{ width: "100%" }}
                  value={terms.mockSelections.map(mockChoiceKey)}
                  options={content.mocks.map((m) => ({
                    value: mockChoiceKey(m.selection),
                    label: m.label,
                  }))}
                  onChange={(keys: string[]) =>
                    edit({
                      mockSelections: keys.map((k) => JSON.parse(k)),
                      attemptLimit: keys.length
                        ? Math.max(1, terms.attemptLimit)
                        : 0,
                    })
                  }
                />
              </label>
              <label>
                Toplam Mock çözme hakkı
                <InputNumber
                  aria-label="Toplam Mock çözme hakkı"
                  min={0}
                  max={100000}
                  value={terms.attemptLimit}
                  onChange={(n) => edit({ attemptLimit: n ?? 0 })}
                />
              </label>
              <Typography.Text type="secondary">
                Seçilen Yazma ve Konuşma bölümlerinin her çözümüne birer AI
                değerlendirmesi dahildir.
              </Typography.Text>
            </>
          )}
          {(canComponents || terms.kind === "LESSON_PACKAGE") && (
            <label>
              Dahil dersler
              <Select
                aria-label="Dahil dersler"
                mode="multiple"
                style={{ width: "100%" }}
                value={terms.lessonIds}
                options={content.lessons.map((l) => ({
                  value: l.id,
                  label: l.title,
                }))}
                onChange={(lessonIds: string[]) => edit({ lessonIds })}
              />
            </label>
          )}
          <Checkbox
            checked={!!terms.discount}
            onChange={(e) =>
              edit({
                discount: e.target.checked
                  ? {
                      kind: "PERCENT",
                      value: 10,
                      startsAt: new Date().toISOString(),
                      endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
                    }
                  : null,
              })
            }
          >
            Zamanlı indirim
          </Checkbox>
          {terms.discount && (
            <>
              <Space>
                <Select
                  aria-label="İndirim türü"
                  value={terms.discount.kind}
                  onChange={(kind) =>
                    edit({ discount: { ...terms.discount!, kind } })
                  }
                  options={[
                    { value: "PERCENT", label: "Yüzde (%)" },
                    { value: "AMOUNT_UZS", label: "Sabit som" },
                  ]}
                />
                <InputNumber
                  aria-label="İndirim değeri"
                  value={terms.discount.value}
                  min={1}
                  onChange={(n) =>
                    edit({ discount: { ...terms.discount!, value: n ?? 0 } })
                  }
                />
              </Space>
              <Typography.Text>
                Saat dilimi: Taşkent (UTC+5). Başlangıç dahil, bitiş hariç.
              </Typography.Text>
              {(["startsAt", "endsAt"] as const).map((field) => (
                <label key={field}>
                  {field === "startsAt"
                    ? "İndirim başlangıcı"
                    : "İndirim bitişi"}
                  <Input
                    type="datetime-local"
                    value={localAccessInput(terms.discount![field])}
                    onChange={(e) => {
                      try {
                        edit({
                          discount: {
                            ...terms.discount!,
                            [field]: parseAccessInput(e.target.value),
                          },
                        });
                      } catch {
                        setError("Geçerli tarih ve saat seçin.");
                      }
                    }}
                  />
                </label>
              ))}
            </>
          )}
        </fieldset>
        <Space style={{ marginTop: 20 }}>
          <Button loading={busy} onClick={() => perform(false)}>
            Kaydet
          </Button>
          <Button
            type="primary"
            disabled={busy || dirty || !current.id}
            onClick={() => perform(true)}
          >
            Yayımla
          </Button>
        </Space>
        {dirty && <p>Yayımlamadan önce değişiklikleri kaydedin.</p>}
      </Card>
      <BillingPackagePreview terms={terms} />
    </div>
  );
}
