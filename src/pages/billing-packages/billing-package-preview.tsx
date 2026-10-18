import { Card, Typography, Tag } from "antd";
import { previewPrice, type PackageTerms } from "./billing-package-form";
export default function BillingPackagePreview({
  terms,
}: {
  terms: PackageTerms;
}) {
  const price = previewPrice(terms);
  const hasDiscount = price < terms.basePriceUzs;
  return (
    <Card title="Öğrenciye sunulan paket" size="small" role="region" aria-label="Paket önizlemesi">
      <Typography.Title level={4}>{terms.name}</Typography.Title>
      {hasDiscount && <Typography.Text type="secondary" style={{ textDecoration: "line-through" }}>{terms.basePriceUzs.toLocaleString("tr-TR")} som</Typography.Text>}
      <Typography.Title level={3}>
        {price.toLocaleString("tr-TR")} som
      </Typography.Title>
      {terms.kind === "MEMBERSHIP" && terms.campaign && <p>{hasDiscount ? `Kampanya fiyatı · ${terms.campaign.label}` : "Normal fiyat"}</p>}
      {terms.kind === "MEMBERSHIP" && terms.campaign && <Typography.Text type="secondary">Taslak önizlemesi. Katılım sınırı ve öğrenciye uygunluk satın alma sırasında kontrol edilir.</Typography.Text>}
      <p>{terms.description}</p>
      <p>
        {terms.periodDays
          ? `${terms.periodDays} gün erişim`
          : terms.validityDays
            ? `${terms.validityDays} gün geçerli`
            : "Süresiz Mock hakkı"}
      </p>
      {terms.standardMockAccess && <Tag>Standart Mock erişimi</Tag>}
      {terms.attemptLimit > 0 && (
        <Tag>{terms.attemptLimit} seçilmiş Mock çözümü</Tag>
      )}
      {terms.quotas.MOCK_WRITING > 0 && (
        <p>{terms.quotas.MOCK_WRITING} Yazma Mock değerlendirmesi</p>
      )}
      {terms.quotas.MOCK_SPEAKING > 0 && (
        <p>{terms.quotas.MOCK_SPEAKING} Konuşma Mock değerlendirmesi</p>
      )}
      {terms.practiceScopes.length > 0 && (
        <p>{terms.quotas.PRACTICE_AI} ortak AI Pratik değerlendirmesi</p>
      )}
      {terms.lessonIds.length > 0 && <p>{terms.lessonIds.length} ders</p>}
      <Typography.Text type="secondary">
        Yayımlama yalnız yeni satışları değiştirir. Önceki satın almalar ve
        hazırlanmış ödemeler kendi şartlarını korur.
      </Typography.Text>
    </Card>
  );
}
