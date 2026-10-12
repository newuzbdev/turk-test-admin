import StudentDeviceSummary from "./student-device-summary";
import {
  Alert,
  Button,
  Col,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  studentPages,
  type ActivityState,
  type StudentLiveFilters,
  type StudentPage,
} from "@/config/queries/students";
import { useAccessConfig } from "@/config/queries/access";
import {
  useActivityFreshness,
  useDocumentVisible,
  useStudentLiveQuery,
} from "./student-live-query";
import StudentActivitySummary, {
  activitySection,
  activityTime,
  pageLabels,
  StudentActivityState,
} from "./student-activity-summary";
export default function StudentLiveTable() {
  const [filters, setFilters] = useState<StudentLiveFilters>({
    q: "",
    page: 1,
    limit: 25,
  });
  const visible = useDocumentVisible();
  const config = useAccessConfig();
  const live = useStudentLiveQuery(filters, {
    enabled: config.data?.enabled === true,
    visible,
  });
  const fresh =
    useActivityFreshness(
      live.data?.observedAt,
      live.isError,
      live.isFetchedAfterMount,
    ) &&
    visible &&
    config.data?.enabled === true;
  const navigate = useNavigate();
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Text>
        Son 90 saniyede bağlantısı olan öğrenciler
      </Typography.Text>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Kayıtlı öğrenci"
            value={fresh ? live.data?.registeredCount : "—"}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Çevrimiçi öğrenci"
            value={fresh ? live.data?.onlineCount : "—"}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Doğrulanmış çözüm"
            value={fresh ? live.data?.solvingCount : "—"}
          />
        </Col>
      </Row>
      <Space wrap>
        <Input.Search
          aria-label="Canlı öğrenci ara"
          placeholder="Hesap numarası, ad, e-posta veya Telegram"
          maxLength={160}
          style={{ width: 280 }}
          onSearch={(q) => setFilters({ ...filters, q, page: 1 })}
        />
        <Select<StudentPage>
          aria-label="Öğrenci sayfası"
          placeholder="Tüm sayfalar"
          allowClear
          style={{ width: 180 }}
          value={filters.studentPage}
          options={studentPages.map((value) => ({
            value,
            label: pageLabels[value],
          }))}
          onChange={(studentPage) =>
            setFilters({ ...filters, studentPage, page: 1 })
          }
        />
        <Select<ActivityState>
          aria-label="Etkinlik durumu"
          placeholder="Tüm durumlar"
          allowClear
          style={{ width: 200 }}
          value={filters.state}
          options={[
            { value: "PAGE", label: "Sayfada" },
            { value: "PREPARING", label: "Hazırlık" },
            { value: "SOLVING", label: "Çözüyor (doğrulanmış)" },
            { value: "EVALUATING", label: "Değerlendiriliyor" },
          ]}
          onChange={(state) => setFilters({ ...filters, state, page: 1 })}
        />
        <Button
          disabled={!visible || config.data?.enabled !== true}
          loading={live.isFetching}
          onClick={() => void live.refetch()}
        >
          Yenile
        </Button>
      </Space>
      {config.data?.enabled === false && (
        <Alert
          type="info"
          message="Canlı öğrenci görünümü henüz etkin değil."
        />
      )}
      {(live.isError || config.isError) && (
        <Alert
          type="error"
          message="Canlı öğrenciler yüklenemedi. Canlı durum doğrulanamıyor."
        />
      )}
      {live.data && !fresh && (
        <Alert
          type="warning"
          message="Eski veri · Canlı durum ve toplamlar güncel değil."
        />
      )}
      <Typography.Text type="secondary">
        Son güncelleme (UTC+5): {activityTime(live.data?.observedAt)}
      </Typography.Text>
      <Table
        rowKey="id"
        loading={live.isLoading || config.isLoading}
        dataSource={live.data?.items ?? []}
        scroll={{ x: 1320 }}
        locale={{ emptyText: "Bu filtrelerde bağlantısı olan öğrenci yok." }}
        columns={[
          {
            title: "Öğrenci",
            width: 230,
            render: (_, r) => (
              <Space direction="vertical" size={0}>
                <Typography.Text>{r.name ?? "—"}</Typography.Text>
                <Typography.Text type="secondary">
                  {r.email ?? "—"}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {r.telegramUsername ?? r.telegramId ?? "—"}
                </Typography.Text>
              </Space>
            ),
          },
          { title: "Sayfa", render: (_, r) => pageLabels[r.page] },
          {
            title: "Cihaz",
            width: 160,
            render: (_, r) => <StudentDeviceSummary device={r.device} />,
          },
          {
            title: "Durum",
            render: (_, r) => <StudentActivityState row={r} fresh={fresh} />,
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
          {
            title: "Tamamlananlar",
            render: (_, r) => (
              <Space direction="vertical" size={0}>
                <Typography.Text>
                  Mock: {r.counts.mockStarted} başlanan /{" "}
                  {r.counts.mockCompleted} tamamlanan
                </Typography.Text>
                <Typography.Text>
                  Pratik: Okuma {r.counts.practiceCompleted.reading} · Yazma{" "}
                  {r.counts.practiceCompleted.writing} · Konuşma{" "}
                  {r.counts.practiceCompleted.speaking}
                </Typography.Text>
                <Typography.Text type="secondary">
                  Dinleme: Henüz ölçülmüyor
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: "İşlem",
            fixed: "right",
            width: 140,
            render: (_, r) => (
              <Button onClick={() => navigate(`/students/${r.id}`)}>
                Hesabı yönet
              </Button>
            ),
          },
        ]}
        expandable={{
          expandedRowRender: (r) => (
            <StudentActivitySummary counts={r.counts} />
          ),
        }}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: live.data?.total ?? 0,
          pageSizeOptions: [25, 50, 100],
          showSizeChanger: true,
          onChange: (page, limit) =>
            setFilters({ ...filters, page, limit: Math.min(limit, 100) }),
        }}
      />
    </Space>
  );
}
