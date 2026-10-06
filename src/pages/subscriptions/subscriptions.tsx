import { useState } from "react";
import {
  Alert,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  useAdminSubscriptions,
  useSubscriptionConfig,
  type AdminSubscriptionRow,
  type SubscriptionListStatus,
} from "@/config/queries/subscriptions";

const { Title, Text } = Typography;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const userLabel = (row: AdminSubscriptionRow) =>
  row.user.name || row.user.username || row.user.email || row.user.phoneNumber || "İsimsiz öğrenci";

const formatUzs = (amount: number) =>
  `${new Intl.NumberFormat("tr-TR").format(amount)} UZS`;

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriptionListStatus>("ALL");
  const query = useAdminSubscriptions({ page, limit, search, status });
  const config = useSubscriptionConfig();

  const columns: TableColumnsType<AdminSubscriptionRow> = [
    {
      title: "Öğrenci",
      key: "student",
      width: 240,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{userLabel(row)}</Text>
          <Text type="secondary">
            {row.user.username ? `@${row.user.username}` : row.user.email || row.user.phoneNumber || "—"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Durum",
      dataIndex: "status",
      width: 120,
      render: (value: AdminSubscriptionRow["status"]) => (
        <Tag color={value === "ACTIVE" ? "green" : "default"}>
          {value === "ACTIVE" ? "Aktif" : "Süresi doldu"}
        </Tag>
      ),
    },
    {
      title: "Üyelik dönemi",
      key: "period",
      width: 220,
      render: (_, row) => `${formatDate(row.periodStart)} – ${formatDate(row.periodEnd)}`,
    },
    ...([['MOCK_WRITING', 'Yazma mock'], ['MOCK_SPEAKING', 'Konuşma mock'], ['PRACTICE_AI', 'Ortak pratik']] as const).map(([bucket, title]) => ({
      title, key: bucket, width: 190,
      render: (_: unknown, row: AdminSubscriptionRow) => {
        const quota = row.quotas[bucket];
        return `${quota.remaining} kaldı · ${quota.used}/${quota.granted} kullanıldı`;
      },
    })),
    {
      title: "Kullanılabilir toplam",
      dataIndex: "totalAssessmentRemaining",
      width: 160,
      align: "center",
      render: (value: number, row) => (
        <Text strong={row.status === "ACTIVE"}>{value}</Text>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            Abonelikler
          </Title>
          <Text type="secondary">
            Aylık üyelikleri ve yazma–konuşma değerlendirme haklarını görüntüleyin. Bu alan coin bakiyesinden tamamen ayrıdır.
          </Text>
        </div>

        {config.data ? (
          <Card size="small">
            <Space direction="vertical" size={4}>
              <Space wrap>
                <Text strong>Etkin erişim modeli</Text>
                <Tag color={config.data.billingMode === "subscription" ? "blue" : "default"}>
                  {config.data.billingMode === "subscription" ? "Abonelik" : "Coin"}
                </Tag>
              </Space>
              <Text type="secondary">
                {config.data.plan.periodDays} gün · {formatUzs(config.data.plan.baseMonthlyPriceUzs)} ·
                {config.data.plan.quotas.MOCK_WRITING} yazma mock · {config.data.plan.quotas.MOCK_SPEAKING} konuşma mock · {config.data.plan.quotas.PRACTICE_AI} ortak pratik
              </Text>
            </Space>
          </Card>
        ) : null}

        <Card>
          <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
            <Input.Search
              allowClear
              placeholder="Ad, kullanıcı adı, telefon veya e-posta ara"
              onSearch={(value) => {
                setSearch(value.trim());
                setPage(1);
              }}
              style={{ width: 360, maxWidth: "100%" }}
            />
            <Select<SubscriptionListStatus>
              value={status}
              style={{ width: 170 }}
              options={[
                { value: "ALL", label: "Tüm abonelikler" },
                { value: "ACTIVE", label: "Aktif" },
                { value: "EXPIRED", label: "Süresi dolan" },
              ]}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
          </Space>
        </Card>

        {query.isError ? (
          <Alert
            type="error"
            showIcon
            message="Abonelikler yüklenemedi"
            description="Sunucunun güncel abonelik altyapısıyla çalıştığını ve veritabanı geçişinin uygulandığını kontrol edin."
          />
        ) : null}

        <Table<AdminSubscriptionRow>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data ?? []}
          loading={query.isPending}
          scroll={{ x: 1180 }}
          pagination={{
            current: query.data?.meta.page ?? page,
            pageSize: query.data?.meta.limit ?? limit,
            total: query.data?.meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (nextPage, nextLimit) => {
              setPage(nextLimit !== limit ? 1 : nextPage);
              setLimit(nextLimit);
            },
          }}
          locale={{ emptyText: "Henüz abonelik kaydı yok." }}
        />
      </Space>
    </div>
  );
}
