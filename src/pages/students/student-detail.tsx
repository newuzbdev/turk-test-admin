import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Input,
  Typography,
  Space,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useStudent, useStudentAccess } from "@/config/queries/students";
import { useAccessConfig } from "@/config/queries/access";
import StudentSubscriptionCard from "./student-subscription-card";
import StudentDeviceSummary from "./student-device-summary";
import { useSubscriptionAdminId } from "./student-subscription-query";
import AccessGrantDialog from "@/components/access/AccessGrantDialog";
import AccessRecordActions from "@/components/access/AccessRecordActions";
import {
  useActivityFreshness,
  useDocumentVisible,
  useStudentActivityQuery,
} from "./student-live-query";
import StudentActivitySummary, {
  activitySection,
  activityTime,
  pageLabels,
  StudentActivityState,
  studentHistoryStatus,
} from "./student-activity-summary";
export default function StudentDetail() {
  const { id = "" } = useParams();
  const adminId = useSubscriptionAdminId();
  return <StudentDetailContent key={`${id}:${adminId}`} id={id} />;
}
function StudentDetailContent({ id }: { id: string }) {
  const student = useStudent(id);
  const access = useStudentAccess(id);
  const config = useAccessConfig();
  const [grant, setGrant] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    q: "",
    page: 1,
    limit: 25,
  });
  const visible = useDocumentVisible();
  const activity = useStudentActivityQuery(id, historyFilters, {
    enabled: config.data?.enabled === true,
    visible,
  });
  const fresh =
    useActivityFreshness(
      activity.data?.observedAt,
      activity.isError,
      activity.isFetchedAfterMount,
    ) && visible;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title={student.data?.name ?? "Öğrenci"} loading={student.isLoading}>
        {(student.isError || config.isError) && (
          <Alert
            type="error"
            message="Öğrenci yüklenemedi"
            action={
              <Button
                onClick={() => {
                  void config.refetch();
                  void student.refetch();
                }}
              >
                Yeniden dene
              </Button>
            }
          />
        )}
        <Descriptions
          items={[
            { key: "email", label: "E-posta", children: student.data?.email },
            {
              key: "telegram",
              label: "Telegram",
              children:
                student.data?.telegramUsername ?? student.data?.telegramId,
            },
            { key: "id", label: "Kimlik", children: student.data?.id },
            {
              key: "device",
              label: "Son kullanılan cihaz",
              span: 3,
              children: activity.isLoading ? (
                "Yükleniyor…"
              ) : activity.isError ? (
                "Bilgi yüklenemedi"
              ) : (
                <StudentDeviceSummary
                  device={activity.data?.lastDevice}
                  showTime
                />
              ),
            },
          ]}
        />
      </Card>
      <StudentSubscriptionCard key={id} userId={id} />
      <Card
        title="Etkinlik ve tamamlananlar"
        extra={
          <Button
            disabled={!visible || !config.data?.enabled}
            loading={activity.isFetching}
            onClick={() => void activity.refetch()}
          >
            Yenile
          </Button>
        }
      >
        {activity.isLoading && (
          <Typography.Text>Etkinlik yükleniyor…</Typography.Text>
        )}
        {config.data?.enabled === false && (
          <Alert type="info" message="Öğrenci etkinliği henüz etkin değil." />
        )}
        {activity.isError && (
          <Alert
            type="error"
            message="Öğrenci etkinliği yüklenemedi. Canlı durum doğrulanamıyor."
          />
        )}
        {activity.data && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {!fresh && (
              <Alert
                type="warning"
                message="Eski veri · Canlı durum güncel değil."
              />
            )}
            <Typography.Text type="secondary">
              Son güncelleme (UTC+5): {activityTime(activity.data.observedAt)}
            </Typography.Text>
            <StudentActivitySummary counts={activity.data.counts} />
            <Table
              rowKey="key"
              dataSource={activity.data.activePages.map((row, index) => ({
                ...row,
                key: `${row.page}-${row.lastSeenAt}-${index}`,
              }))}
              pagination={false}
              columns={[
                { title: "Sayfa", render: (_, r) => pageLabels[r.page] },
                {
                  title: "Cihaz",
                  render: (_, r) => <StudentDeviceSummary device={r.device} />,
                },
                {
                  title: "Durum",
                  render: (_, r) => (
                    <StudentActivityState row={r} fresh={fresh} />
                  ),
                },
                {
                  title: "Hedef / bölüm",
                  render: (_, r) =>
                    [r.activity.title, activitySection(r.activity.section)]
                      .filter(Boolean)
                      .join(" · ") || "—",
                },
                {
                  title: "Son bağlantı (UTC+5)",
                  render: (_, r) => activityTime(r.lastSeenAt),
                },
              ]}
            />
          </Space>
        )}
      </Card>
      <Card title="Sınav ve pratik geçmişi">
        <Input.Search
          aria-label="Etkinlik geçmişinde ara"
          placeholder="Başlığa göre ara"
          maxLength={160}
          onSearch={(q) => setHistoryFilters({ ...historyFilters, q, page: 1 })}
        />
        <Table
          rowKey="id"
          loading={activity.isLoading}
          dataSource={activity.data?.history.items ?? []}
          columns={[
            {
              title: "Tür",
              render: (_, r) =>
                ({
                  MOCK: "Mock",
                  PRACTICE_READING: "Okuma pratiği",
                  PRACTICE_WRITING: "Yazma pratiği",
                  PRACTICE_SPEAKING: "Konuşma pratiği",
                })[r.kind],
            },
            { title: "Başlık", render: (_, r) => r.title ?? "—" },
            {
              title: "Durum",
              render: (_, r) => studentHistoryStatus(r.status),
            },
            {
              title: "Yazma değerlendirmesi",
              render: (_, r) => studentHistoryStatus(r.writingEvaluationStatus),
            },
            {
              title: "Konuşma değerlendirmesi",
              render: (_, r) =>
                studentHistoryStatus(r.speakingEvaluationStatus),
            },
            {
              title: "Başlangıç (UTC+5)",
              render: (_, r) => activityTime(r.startedAt),
            },
            {
              title: "Tamamlanma (UTC+5)",
              render: (_, r) => activityTime(r.completedAt),
            },
          ]}
          pagination={{
            current: historyFilters.page,
            pageSize: historyFilters.limit,
            total: activity.data?.history.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [25, 50, 100],
            onChange: (page, limit) =>
              setHistoryFilters({
                ...historyFilters,
                page,
                limit: Math.min(limit, 100),
              }),
          }}
        />
      </Card>
      <Card
        title="Hediye erişimler"
        extra={
          <Button
            disabled={!config.data?.enabled || !student.data}
            onClick={() => setGrant(true)}
          >
            Erişim ver
          </Button>
        }
      >
        {config.data?.enabled === false && (
          <Alert type="info" message="Erişim yönetimi henüz etkin değil." />
        )}
        {access.isError && (
          <Alert
            type="error"
            message="Erişimler yüklenemedi"
            action={
              <Button onClick={() => void access.refetch()}>
                Yeniden dene
              </Button>
            }
          />
        )}
        <Table
          rowKey="id"
          loading={access.isLoading}
          dataSource={access.data}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Kapsam",
              render: (_, r) =>
                `${r.scope}${r.targetId && r.scope !== "PLATFORM" ? ` / ${r.targetId}` : ""}`,
            },
            {
              title: "Durum",
              render: (_, r) => (
                <Tag>
                  {
                    (
                      {
                        ACTIVE: "Aktif",
                        SCHEDULED: "Planlandı",
                        EXPIRED: "Süresi doldu",
                        REVOKED: "İptal edildi",
                      } as Record<string, string>
                    )[r.state ?? ""]
                  }
                </Tag>
              ),
            },
            {
              title: "Başlangıç / bitiş (UTC+5)",
              render: (_, r) =>
                [r.startsAt, r.endsAt]
                  .map((t) =>
                    new Date(t).toLocaleString("tr-TR", {
                      timeZone: "Asia/Tashkent",
                    }),
                  )
                  .join(" — "),
            },
            {
              title: "Kalan haklar",
              render: (_, r) =>
                Object.entries(r.remaining ?? {})
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", "),
            },
            {
              title: "İşlem",
              render: (_, r) => <AccessRecordActions kind="grant" record={r} />,
            },
          ]}
          expandable={{
            expandedRowRender: (r) => (
              <Collapse
                items={[
                  {
                    key: "audit",
                    label: "İç not ve denetim geçmişi",
                    children: (
                      <>
                        <p>{r.reason}</p>
                        {r.audit?.map((a, i) => (
                          <p key={i}>
                            {new Date(a.occurredAt).toLocaleString("tr-TR", {
                              timeZone: "Asia/Tashkent",
                            })}{" "}
                            · {a.action} · {a.actorId} · {a.reason}
                          </p>
                        ))}
                      </>
                    ),
                  },
                ]}
              />
            ),
          }}
        />
      </Card>
      {grant && (
        <AccessGrantDialog userId={id} onClose={() => setGrant(false)} />
      )}
    </Space>
  );
}
