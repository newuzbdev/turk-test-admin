import { Descriptions, Space, Tag } from "antd";
import type {
  StudentActivePage,
  StudentCounts,
  StudentPage,
} from "@/config/queries/students";
export const pageLabels: Record<StudentPage, string> = {
  DASHBOARD: "Ana sayfa",
  MOCK_CATALOG: "Mock sınavları",
  PRACTICE_CATALOG: "Pratikler",
  PREPARATION: "Hazırlık",
  MOCK_TEST: "Mock sınavı",
  PRACTICE_TEST: "Pratik sayfası",
  RESULT: "Sonuç",
  PROFILE: "Profil",
  SUBSCRIPTION: "Abonelik",
  OTHER: "Diğer sayfa",
};
export function activitySection(section: string | null) {
  return section
    ? ((
        {
          READING: "Okuma",
          LISTENING: "Dinleme",
          WRITING: "Yazma",
          SPEAKING: "Konuşma",
        } as Record<string, string>
      )[section] ?? section)
    : null;
}
export function activityTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleString("tr-TR", { timeZone: "Asia/Tashkent" })
    : "—";
}
export function StudentActivityState({
  row,
  fresh,
}: {
  row: StudentActivePage;
  fresh: boolean;
}) {
  if (!fresh) return <Tag>Eski veri</Tag>;
  return (
    <Space wrap>
      <Tag color="green">Çevrimiçi</Tag>
      {!row.visible && <Tag>Arka planda</Tag>}
      <Tag color={row.activity.state === "SOLVING" ? "blue" : undefined}>
        {
          {
            PAGE:
              row.page === "PRACTICE_TEST"
                ? "Pratik sayfasında (çözüm doğrulanmadı)"
                : "Sayfada",
            PREPARING: "Hazırlık",
            SOLVING: "Çözüyor (doğrulanmış)",
            EVALUATING: "Değerlendiriliyor",
          }[row.activity.state]
        }
      </Tag>
    </Space>
  );
}
export default function StudentActivitySummary({
  counts,
}: {
  counts: StudentCounts;
}) {
  return (
    <Descriptions
      size="small"
      column={{ xs: 1, sm: 2, lg: 3 }}
      items={[
        {
          key: "mock-started",
          label: "Başlanan Mock",
          children: counts.mockStarted,
        },
        {
          key: "mock-completed",
          label: "Tamamlanan Mock",
          children: counts.mockCompleted,
        },
        {
          key: "reading",
          label: "Tamamlanan Okuma pratiği",
          children: counts.practiceCompleted.reading,
        },
        {
          key: "listening",
          label: "Tamamlanan Dinleme pratiği",
          children: "Henüz ölçülmüyor",
        },
        {
          key: "writing",
          label: "Tamamlanan Yazma pratiği",
          children: counts.practiceCompleted.writing,
        },
        {
          key: "speaking",
          label: "Tamamlanan Konuşma pratiği",
          children: counts.practiceCompleted.speaking,
        },
      ]}
    />
  );
}
export function studentHistoryStatus(status: string | null) {
  return status
    ? ((
        {
          COMPLETED: "Tamamlandı",
          STARTED: "Başladı",
          PENDING: "Değerlendirme bekliyor",
          FAILED: "Değerlendirme başarısız",
          IN_PROGRESS: "Devam ediyor",
          NOT_STARTED: "Başlamadı",
          SUBMITTED: "Gönderildi",
          EXPIRED: "Süresi doldu",
        } as Record<string, string>
      )[status] ?? status)
    : "—";
}
