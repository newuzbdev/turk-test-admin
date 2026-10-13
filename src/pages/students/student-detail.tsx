import {
  Alert,
  Button,
  Card,
  Collapse,
  Input,
  Typography,
  Space,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import { useParams } from "react-router-dom";
import "./students.css";
import type { AccessScope } from "@/config/queries/access";
import { joinedTime } from "./student-joined-time";
import { subscriptionTime } from "./student-subscription-query";
import { useStudent, useStudentAccess } from "@/config/queries/students";
import { useAccessConfig } from "@/config/queries/access";
import StudentSubscriptionCard from "./student-subscription-card";
import StudentOriginSummary from "./student-origin-summary";
import StudentDeviceSummary from "./student-device-summary";
import { useSubscriptionAdminId } from "./student-subscription-query";
import AccessGrantDialog from "@/components/access/AccessGrantDialog";
import AccessRecordActions from "@/components/access/AccessRecordActions";
import {
  currentAdminId,
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
const scopeLabels: Record<AccessScope, string> = {
  PLATFORM: "Tam platform",
  MOCK_PACKAGE: "Deneme paketi",
  MOCK_READING: "Okuma Mock",
  MOCK_LISTENING: "Dinleme Mock",
  MOCK_WRITING: "Yazma Mock",
  MOCK_SPEAKING: "Konuşma Mock",
  PRACTICE_READING: "Okuma pratiği",
  PRACTICE_LISTENING: "Dinleme pratiği",
  PRACTICE_WRITING: "Yazma pratiği",
  PRACTICE_SPEAKING: "Konuşma pratiği",
};
const bucketLabels: Record<string, string> = {
  MOCK_WRITING: "Yazma Mock",
  MOCK_SPEAKING: "Konuşma Mock",
  PRACTICE_AI: "AI pratik",
};
const auditLabels: Record<string, string> = {
  CREATE: "Verildi",
  UPDATE: "Düzenlendi",
  REVOKE: "İptal edildi",
  REDEEM: "Kullanıldı",
};
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
  const [showHistory, setShowHistory] = useState(false);
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
    <div className="student-management student-detail">
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
        <dl className="student-account-summary">
          <div>
            <dt>E-posta</dt>
            <dd>{student.data?.email || "—"}</dd>
          </div>
          <div>
            <dt>Telegram</dt>
            <dd>
              {student.data?.telegramUsername
                ? `@${student.data.telegramUsername}`
                : student.data?.telegramId || "—"}
            </dd>
          </div>
          <div>
            <dt>Katılım (UTC+5)</dt>
            <dd className="student-date">
              {joinedTime(student.data?.createdAt)}
            </dd>
          </div>
          <div className="student-account-id">
            <dt>Hesap no</dt>
            <dd>
              {student.data && (
                <Typography.Text
                  className="student-account-number"
                  copyable={{
                    text: student.data.id,
                    tooltips: ["Hesap numarasını kopyala", "Kopyalandı"],
                  }}
                >
                  {student.data.id}
                </Typography.Text>
              )}
            </dd>
          </div>
          <div className="student-account-device">
            <dt>Son kullanılan cihaz</dt>
            <dd>
              {activity.isLoading ? (
                "Yükleniyor…"
              ) : activity.isError ? (
                "Bilgi yüklenemedi"
              ) : (
                <StudentDeviceSummary
                  device={activity.data?.lastDevice}
                  showTime
                />
              )}
            </dd>
          </div>
        </dl>
        <StudentOriginSummary student={student.data} />
      </Card>
      <StudentSubscriptionCard key={id} userId={id} />
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
          size="middle"
          scroll={{ x: 950 }}
          locale={{ emptyText: "Bu hesapta hediye erişim bulunmuyor." }}
          loading={access.isLoading}
          dataSource={access.data}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Kapsam",
              width: 160,
              render: (_, r) => (
                <Space direction="vertical" size={2}>
                  <Typography.Text>{scopeLabels[r.scope]}</Typography.Text>
                  {r.targetId && r.scope !== "PLATFORM" && (
                    <Typography.Text
                      type="secondary"
                      className="student-account-number"
                      title={r.targetId}
                      copyable={{ text: r.targetId }}
                    >
                      İçerik: {r.targetId.slice(0, 8)}…
                    </Typography.Text>
                  )}
                </Space>
              ),
            },
            {
              title: "Durum",
              width: 120,
              render: (_, r) => (
                <Tag
                  color={
                    r.state === "ACTIVE"
                      ? "green"
                      : r.state === "REVOKED"
                        ? "red"
                        : undefined
                  }
                >
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
              title: "Erişim dönemi (UTC+5)",
              width: 220,
              render: (_, r) => (
                <Space direction="vertical" size={2}>
                  <Typography.Text type="secondary">
                    Başlangıç: {subscriptionTime(r.startsAt)}
                  </Typography.Text>
                  <Typography.Text>
                    Bitiş: {subscriptionTime(r.endsAt)}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Kalan haklar",
              width: 170,
              render: (_, r) => (
                <Space direction="vertical" size={2}>
                  {Object.entries(r.remaining ?? {}).map(([k, v]) => (
                    <Typography.Text key={k}>
                      {bucketLabels[k] ?? k}: <strong>{v}</strong>
                    </Typography.Text>
                  ))}
                </Space>
              ),
            },
            {
              title: "İşlem",
              width: 180,
              fixed: "right",
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
                        <Table
                          size="small"
                          pagination={false}
                          rowKey={(a) =>
                            `${a.occurredAt}:${a.actorId}:${a.action}`
                          }
                          dataSource={r.audit ?? []}
                          scroll={{ x: 650 }}
                          columns={[
                            {
                              title: "Tarih (UTC+5)",
                              render: (_, a) => subscriptionTime(a.occurredAt),
                              width: 180,
                            },
                            {
                              title: "İşlem",
                              render: (_, a) =>
                                auditLabels[a.action] ?? a.action,
                              width: 120,
                            },
                            { title: "Not", dataIndex: "reason" },
                            {
                              title: "Yönetici",
                              render: (_, a) => (
                                <Typography.Text title={a.actorId}>
                                  {a.actorId === currentAdminId()
                                    ? "Siz"
                                    : "Yönetici"}
                                </Typography.Text>
                              ),
                              width: 100,
                            },
                          ]}
                        />
                      </>
                    ),
                  },
                ]}
              />
            ),
          }}
        />
      </Card>
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
              size="middle"
              scroll={{ x: 900 }}
              locale={{ emptyText: "Şu anda açık öğrenci sayfası yok." }}
              rowKey="key"
              dataSource={activity.data.activePages.map((row, index) => ({
                ...row,
                key: `${row.page}-${row.lastSeenAt}-${index}`,
              }))}
              pagination={false}
              columns={[
                {
                  title: "Sayfa",
                  width: 150,
                  render: (_, r) => pageLabels[r.page],
                },
                {
                  title: "Cihaz",
                  width: 160,
                  render: (_, r) => <StudentDeviceSummary device={r.device} />,
                },
                {
                  title: "Durum",
                  width: 210,
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
                  width: 180,
                  render: (_, r) => activityTime(r.lastSeenAt),
                },
              ]}
            />
          </Space>
        )}
      </Card>
      <Card
        title="Sınav ve pratik geçmişi"
        extra={
          <Button onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "Geçmişi gizle" : "Geçmişi göster"}
          </Button>
        }
      >
        {showHistory && (
          <>
            <Input.Search
              className="student-search"
              style={{ marginBottom: 16 }}
              aria-label="Etkinlik geçmişinde ara"
              placeholder="Başlığa göre ara"
              maxLength={160}
              onSearch={(q) =>
                setHistoryFilters({ ...historyFilters, q, page: 1 })
              }
            />
            <Table
              rowKey="id"
              size="middle"
              scroll={{ x: 1250 }}
              locale={{
                emptyText: "Bu aramada sınav veya pratik kaydı bulunamadı.",
              }}
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
                {
                  title: "Başlık",
                  width: 210,
                  render: (_, r) => r.title ?? "—",
                },
                {
                  title: "Durum",
                  render: (_, r) => studentHistoryStatus(r.status),
                },
                {
                  title: "Yazma değerlendirmesi",
                  render: (_, r) =>
                    studentHistoryStatus(r.writingEvaluationStatus),
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
          </>
        )}
      </Card>

      {grant && (
        <AccessGrantDialog userId={id} onClose={() => setGrant(false)} />
      )}
    </div>
  );
}
