import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  billingApi,
  useBillingContent,
  useBillingHistory,
  useBillingMutation,
  useBillingPackages,
  useBillingSettings,
  useBillingCampaignState,
} from "@/config/queries/billing-packages";
import {
  billingError,
  newPackageDraft,
  type PackageDraft,
  type PackageKind,
} from "./billing-package-form";
import BillingPackageEditor from "./billing-package-editor";
import "./billing-packages.css";
const kindLabels: Record<PackageKind, string> = {
  MEMBERSHIP: "Üyelik",
  MOCK_PASS: "Sayılı Mock Test",
  PRACTICE_PASS: "Yalnız Pratik",
  LESSON_PACKAGE: "Ders Paketi",
};
export default function BillingPackages() {
  const list = useBillingPackages(),
    content = useBillingContent(),
    settings = useBillingSettings();
  const [draft, setDraft] = useState<PackageDraft | null>(null),
    [editorKey, setEditorKey] = useState(0),
    [error, setError] = useState("");
  const history = useBillingHistory(draft?.id);
  const campaign = useBillingCampaignState(draft?.terms.kind === "MEMBERSHIP" ? draft.id : undefined);
  const create = useBillingMutation(billingApi.create),
    save = useBillingMutation(
      ({
        draft,
        terms,
      }: {
        draft: PackageDraft;
        terms: PackageDraft["terms"];
      }) => billingApi.save(draft, terms),
    ),
    publish = useBillingMutation(billingApi.publish),
    sales = useBillingMutation(billingApi.sales),
    sort = useBillingMutation(
      ({ draft, order }: { draft: PackageDraft; order: number }) =>
        billingApi.sort(draft, order),
    ),
    setting = useBillingMutation(billingApi.saveSettings);
  function chooseNew(kind: PackageKind) {
    setDraft(newPackageDraft(kind));
    setError("");
    setEditorKey((k) => k + 1);
  }
  async function reload() {
    if (!draft?.id) return;
    try {
      setDraft(await billingApi.get(draft.id));
      setEditorKey((k) => k + 1);
      setError("");
    } catch (e) {
      setError(billingError(e));
    }
  }
  return (
    <main style={{ padding: 24 }}>
      <Typography.Title level={2}>Paketler ve Fiyatlar</Typography.Title>
      <p>
        Fiyatları ve içerikleri buradan yönetin. Güncellemeler önceki satın
        almaları değiştirmez.
      </p>
      {error && (
        <Alert
          role="alert"
          type="error"
          message={error}
          style={{ marginBottom: 16 }}
        />
      )}
      {(list.isError || content.isError || settings.isError) && (
        <Alert
          role="alert"
          type="error"
          message="Paket bilgileri yüklenemedi."
          action={
            <Button
              onClick={() => {
                void list.refetch();
                void content.refetch();
                void settings.refetch();
              }}
            >
              Yeniden dene
            </Button>
          }
        />
      )}
      <Card size="small" style={{ marginBottom: 20 }}>
        <Space wrap>
          {(Object.keys(kindLabels) as PackageKind[]).map((kind) => (
            <Button
              key={kind}
              disabled={create.isPending}
              onClick={() => chooseNew(kind)}
            >
              Yeni {kindLabels[kind]}
            </Button>
          ))}
          {draft && (
            <Button
              disabled={create.isPending}
              onClick={async () => {
                try {
                  const terms = structuredClone(draft.terms);
                  if (terms.kind === "MEMBERSHIP" && terms.campaign) {
                    terms.campaign = { ...terms.campaign, id: crypto.randomUUID(), enabled: false };
                  }
                  setDraft(
                    await create.mutateAsync({
                      ...terms,
                      name: `${draft.terms.name} kopyası`.slice(0, 120),
                    }),
                  );
                  setEditorKey((k) => k + 1);
                } catch (e) {
                  setError(billingError(e));
                }
              }}
            >
              Paketi kopyala
            </Button>
          )}
        </Space>
      </Card>
      <div className="billing-package-layout">
        <Card title="Paketler" loading={list.isPending}>
          {list.data?.map((row) => (
            <div
              key={row.id}
              style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}
            >
              <Button
                type="text"
                style={{
                  whiteSpace: "normal",
                  height: "auto",
                  textAlign: "left",
                  padding: 0,
                }}
                onClick={() => {
                  setDraft(structuredClone(row));
                  setEditorKey((k) => k + 1);
                  setError("");
                }}
              >
                {row.terms.name}
              </Button>
              <div>
                <Tag>{kindLabels[row.terms.kind]}</Tag>
                <Tag color={row.salesEnabled ? "green" : "default"}>
                  {row.salesEnabled ? "Satışta" : "Satışa kapalı"}
                </Tag>
              </div>
              <p>
                {row.terms.basePriceUzs.toLocaleString("tr-TR")} som · sürüm{" "}
                {row.revision}
              </p>
              <Space>
                <Switch
                  size="small"
                  aria-label={`${row.terms.name} satış`}
                  checked={row.salesEnabled}
                  disabled={!row.activeVersionId || sales.isPending}
                  onChange={async () => {
                    try {
                      await sales.mutateAsync(row);
                    } catch (e) {
                      setError(billingError(e));
                    }
                  }}
                />
                <InputNumber
                  aria-label={`${row.terms.name} sırası`}
                  min={0}
                  max={100000}
                  defaultValue={row.sortOrder}
                  key={`${row.id}-${row.revision}`}
                  onBlur={async (e) => {
                    const order = Number(e.target.value);
                    if (order === row.sortOrder || !Number.isInteger(order))
                      return;
                    try {
                      await sort.mutateAsync({ draft: row, order });
                    } catch (err) {
                      setError(billingError(err));
                    }
                  }}
                />
              </Space>
            </div>
          ))}
        </Card>
        <div>
          {draft && content.data ? (
            <BillingPackageEditor
              key={`${draft.id}-${editorKey}`}
              draft={draft}
              content={content.data}
              campaignState={campaign.data}
              campaignStateError={campaign.isError}
              onSave={async (draft, terms) => {
                const updated = draft.id
                  ? await save.mutateAsync({ draft, terms })
                  : await create.mutateAsync(terms);
                setDraft(updated);
                return updated;
              }}
              onPublish={(draft) => publish.mutateAsync(draft)}
              onReload={() => void reload()}
            />
          ) : (
            <Card>Bir paket seçin veya yeni paket oluşturun.</Card>
          )}
          {draft?.id && (
            <Card
              title="Değişiklik geçmişi"
              size="small"
              style={{ marginTop: 20 }}
            >
              {history.isError ? (
                <Alert type="error" message="Geçmiş yüklenemedi." />
              ) : (
                history.data?.map((h) => (
                  <div key={h.id} style={{ padding: "8px 0" }}>
                    {new Date(h.createdAt).toLocaleString("tr-TR", {
                      timeZone: "Asia/Tashkent",
                    })}{" "}
                    · {h.action} · Yönetici {h.actorId}
                  </div>
                ))
              )}
            </Card>
          )}
        </div>
      </div>
      {settings.data && (
        <Card title="Katalog ayarları" size="small" style={{ marginTop: 20 }}>
          <Space wrap>
            <span>Dersleri yeni öğrencilere göster</span>
            <Switch
              checked={settings.data.lessonsVisible}
              loading={setting.isPending}
              onChange={async (lessonsVisible) => {
                try {
                  await setting.mutateAsync({
                    ...settings.data!,
                    lessonsVisible,
                  });
                } catch (e) {
                  setError(billingError(e));
                }
              }}
            />
            <span>Varsayılan üyelik</span>
            <Select
              aria-label="Varsayılan üyelik"
              style={{ minWidth: 240 }}
              value={settings.data.defaultPackageId}
              disabled={setting.isPending}
              options={list.data
                ?.filter(
                  (p) =>
                    p.terms.kind === "MEMBERSHIP" &&
                    p.salesEnabled &&
                    p.activeVersionId,
                )
                .map((p) => ({ value: p.id, label: p.terms.name }))}
              onChange={async (defaultPackageId) => {
                try {
                  await setting.mutateAsync({
                    ...settings.data!,
                    defaultPackageId,
                  });
                } catch (e) {
                  setError(billingError(e));
                }
              }}
            />
          </Space>
          <p>
            Görünürlüğü kapatmak süresi devam eden satın alınmış ders
            erişimlerini kapatmaz.
          </p>
        </Card>
      )}
    </main>
  );
}
