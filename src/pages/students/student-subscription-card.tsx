import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentAdminId } from "./student-live-query";
import {
  subscriptionActionLabels,
  subscriptionTime,
  studentSubscriptionKey,
  useStudentSubscriptionQuery,
} from "./student-subscription-query";
import type {
  StudentSubscriptionAction,
  StudentSubscriptionState,
} from "./student-subscription-query";
import StudentSubscriptionDialog from "./student-subscription-dialog";

const buckets = [
  { key: "MOCK_WRITING", label: "Yazma Mock" },
  { key: "MOCK_SPEAKING", label: "Konuşma Mock" },
  { key: "PRACTICE_AI", label: "AI pratik" },
] as const;
const statusLabels = {
  ACTIVE: "Aktif",
  EXPIRED: "Süresi doldu",
  SCHEDULED: "Planlandı",
  CANCELLED: "İptal edildi",
};
export default function StudentSubscriptionCard({
  userId,
}: {
  userId: string;
}) {
  const query = useStudentSubscriptionQuery(userId);
  const client = useQueryClient();
  const [selected, setSelected] = useState<{
    action: StudentSubscriptionAction;
    state: StudentSubscriptionState;
    adminId: string;
    userId: string;
  }>();
  const [success, setSuccess] = useState("");
  const context = `${userId}:${query.adminId}`;
  const currentContext = useRef(context);
  currentContext.current = context;
  const dialogOpen =
    selected?.userId === userId && selected.adminId === query.adminId;
  const data = query.data;
  const subscription = data?.subscription;
  const ready =
    !!data &&
    query.isFetchedAfterMount &&
    !query.isError &&
    !query.isFetching &&
    !!query.adminId;
  function open(action: StudentSubscriptionAction) {
    if (ready && data && currentAdminId() === query.adminId) {
      setSuccess("");
      setSelected({ action, state: data, adminId: query.adminId, userId });
    }
  }
  async function refreshAfterSave(updated: StudentSubscriptionState) {
    if (
      currentContext.current !== context ||
      currentAdminId() !== query.adminId
    )
      return;
    client.setQueryData(studentSubscriptionKey(userId, query.adminId), updated);
    await Promise.allSettled([
      client.invalidateQueries({
        queryKey: studentSubscriptionKey(userId, query.adminId),
        exact: true,
      }),
      client.invalidateQueries({
        queryKey: ["admin-subscriptions"],
        predicate: (queryState) => queryState.queryKey[2] === query.adminId,
      }),
    ]);
    if (
      currentContext.current === context &&
      currentAdminId() === query.adminId
    )
      setSuccess(context);
  }
  async function reload() {
    const result = await query.refetch({ throwOnError: true });
    if (
      !result.data ||
      currentContext.current !== context ||
      currentAdminId() !== query.adminId
    )
      throw new Error("Üyelik bilgileri doğrulanamadı.");
  }
  return (
    <Card
      title="Üyelik ve haklar"
      extra={
        <Button
          aria-label="Üyelik bilgilerini yenile"
          disabled={!query.adminId || dialogOpen}
          loading={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Güncelle
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {!query.adminId && (
          <Alert
            type="warning"
            message="Üyelik yönetimi için yönetici oturumu gerekiyor."
          />
        )}
        {query.isLoading && (
          <Typography.Text>Üyelik bilgileri yükleniyor…</Typography.Text>
        )}
        {query.isError && (
          <Alert
            type="error"
            message="Üyelik bilgileri yüklenemedi."
            action={
              <Button onClick={() => void query.refetch()}>Yeniden dene</Button>
            }
          />
        )}
        {success === context && (
          <Alert type="success" message="İşlem tamamlandı." />
        )}
        {data && (
          <>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
              items={
                subscription
                  ? [
                      {
                        key: "status",
                        label: "Durum",
                        children: (
                          <Tag
                            color={
                              subscription.status === "ACTIVE"
                                ? "green"
                                : undefined
                            }
                          >
                            {statusLabels[subscription.status]}
                          </Tag>
                        ),
                      },
                      {
                        key: "start",
                        label: "Başlangıç (UTC+5)",
                        children: subscriptionTime(subscription.periodStart),
                      },
                      {
                        key: "end",
                        label: "Bitiş (UTC+5)",
                        children: subscriptionTime(subscription.periodEnd),
                      },
                    ]
                  : [
                      {
                        key: "none",
                        label: "Durum",
                        children: "Üyelik bulunmuyor.",
                      },
                      {
                        key: "plan",
                        label: "Yeni dönem",
                        children: `${data.plan.periodDays} gün`,
                      },
                    ]
              }
            />
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              scroll={{ x: 420 }}
              dataSource={buckets.map((bucket) => ({
                ...bucket,
                ...(subscription?.quotas[bucket.key] ?? {
                  granted: data.plan.quotas[bucket.key],
                  used: null,
                  remaining: null,
                }),
              }))}
              columns={[
                { title: "Üyelik hakkı", dataIndex: "label" },
                {
                  title: subscription ? "Verilen" : "Yeni dönem hakkı",
                  dataIndex: "granted",
                  align: "right",
                },
                {
                  title: "Kullanılan",
                  dataIndex: "used",
                  align: "right",
                  render: (value) => value ?? "—",
                },
                {
                  title: "Kalan",
                  dataIndex: "remaining",
                  align: "right",
                  render: (value) => (
                    <Typography.Text strong>{value ?? "—"}</Typography.Text>
                  ),
                },
              ]}
            />
            <div className="student-subscription-actions">
              <Space wrap>
                <Button
                  type="primary"
                  disabled={!ready}
                  onClick={() => open("RENEW")}
                >
                  {subscription ? "Üyeliği yenile" : "Üyeliği başlat"}
                </Button>
                <Button
                  disabled={!ready || subscription?.status !== "ACTIVE"}
                  onClick={() => open("EXTEND")}
                >
                  Süre uzat
                </Button>
                <Button
                  disabled={!ready || subscription?.status !== "ACTIVE"}
                  onClick={() => open("ADD_QUOTA")}
                >
                  Hak ekle
                </Button>
                <Button
                  disabled={!ready || subscription?.status !== "ACTIVE"}
                  onClick={() => open("REDUCE_QUOTA")}
                >
                  Hak azalt
                </Button>
              </Space>
              <Button
                danger
                disabled={!ready || subscription?.status !== "ACTIVE"}
                onClick={() => open("CANCEL")}
              >
                Üyeliği iptal et
              </Button>
            </div>
            <Typography.Text type="secondary">
              Hediye erişimler ve satın alınan ek haklar ayrı tutulur.
            </Typography.Text>
            {data.history.length > 0 && (
              <Collapse
                size="small"
                items={[
                  {
                    key: "history",
                    label: "Son yönetici işlemleri",
                    children: (
                      <Table
                        size="small"
                        pagination={false}
                        rowKey="id"
                        dataSource={data.history}
                        scroll={{ x: 650 }}
                        columns={[
                          {
                            title: "Tarih (UTC+5)",
                            render: (_, row) =>
                              subscriptionTime(row.occurredAt),
                            width: 180,
                          },
                          {
                            title: "İşlem",
                            render: (_, row) =>
                              subscriptionActionLabels[row.action],
                            width: 160,
                          },
                          { title: "Not", dataIndex: "reason" },
                          {
                            title: "Yönetici",
                            render: (_, row) => (
                              <Typography.Text title={row.actorId}>
                                {row.actorId === query.adminId
                                  ? "Siz"
                                  : "Yönetici"}
                              </Typography.Text>
                            ),
                            width: 100,
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            )}
          </>
        )}
        {selected && dialogOpen && (
          <StudentSubscriptionDialog
            key={`${selected.userId}:${selected.adminId}:${selected.action}`}
            userId={userId}
            adminId={selected.adminId}
            state={selected.state}
            action={selected.action}
            onClose={() => setSelected(undefined)}
            onSuccess={refreshAfterSave}
            onReload={reload}
          />
        )}
      </Space>
    </Card>
  );
}
