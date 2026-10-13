import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Table,
  Tabs,
  Typography,
  Tag,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useStudents,
  type StudentDirectoryFilters,
} from "@/config/queries/students";
import { useAccessConfig } from "@/config/queries/access";
import StudentLiveTable from "./student-live-table";
import "./students.css";
import { NewStudentNoticeToggle } from "./student-registration-notices";
import {
  registrationLocation,
  registrationMethodLabel,
  registrationSourceLabel,
} from "./student-origin-labels";
import { joinedTime } from "./student-joined-time";
function StudentDirectory() {
  const [filters, setFilters] = useState<StudentDirectoryFilters>({
    q: "",
    page: 1,
    limit: 25,
    joinedPeriod: "ALL",
    membership: "ALL",
    order: "NEWEST",
  });
  const students = useStudents(filters);
  const config = useAccessConfig();
  const navigate = useNavigate();
  return (
    <>
      <div className="student-directory-toolbar">
        <Input.Search
          className="student-search"
          aria-label="Öğrenci ara"
          placeholder="Hesap numarası, ad, e-posta veya Telegram"
          maxLength={160}
          onSearch={(q) => setFilters({ ...filters, q, page: 1 })}
        />
        <label className="student-filter">
          <span>Katılım</span>
          <select
            aria-label="Katılım zamanı"
            value={filters.joinedPeriod}
            onChange={(e) =>
              setFilters({
                ...filters,
                joinedPeriod: e.target
                  .value as StudentDirectoryFilters["joinedPeriod"],
                page: 1,
              })
            }
          >
            <option value="ALL">Tüm zamanlar</option>
            <option value="TODAY">Bugün</option>
            <option value="WEEK">Son 7 gün</option>
            <option value="MONTH">Son 30 gün</option>
          </select>
        </label>
        <label className="student-filter">
          <span>Üyelik</span>
          <select
            aria-label="Üyelik durumu"
            value={filters.membership}
            onChange={(e) =>
              setFilters({
                ...filters,
                membership: e.target
                  .value as StudentDirectoryFilters["membership"],
                page: 1,
              })
            }
          >
            <option value="ALL">Tüm öğrenciler</option>
            <option value="ACTIVE">Aktif üyelik</option>
            <option value="EXPIRED">Süresi dolmuş / iptal</option>
            <option value="NONE">Üyeliği olmayan</option>
          </select>
        </label>
        <label className="student-filter">
          <span>Sıralama</span>
          <select
            aria-label="Katılım sıralaması"
            value={filters.order}
            onChange={(e) =>
              setFilters({
                ...filters,
                order: e.target.value as StudentDirectoryFilters["order"],
                page: 1,
              })
            }
          >
            <option value="NEWEST">En yeni önce</option>
            <option value="OLDEST">En eski önce</option>
          </select>
        </label>
      </div>
      <div className="student-directory-meta">
        <Typography.Text type="secondary">
          {students.data ? `${students.data.total} öğrenci` : ""}
        </Typography.Text>
        <NewStudentNoticeToggle />
      </div>
      {config.data?.enabled === false && (
        <Alert
          type="info"
          message="Öğrenci erişim yönetimi henüz etkin değil."
        />
      )}
      {(students.isError || config.isError) && (
        <Alert
          type="error"
          message="Öğrenciler yüklenemedi"
          action={
            <Button
              onClick={() => {
                void config.refetch();
                void students.refetch();
              }}
            >
              Yeniden dene
            </Button>
          }
        />
      )}
      <Table
        size="middle"
        scroll={{ x: 890 }}
        locale={{ emptyText: "Aramaya uygun öğrenci bulunamadı." }}
        rowKey="id"
        loading={students.isLoading || config.isLoading}
        dataSource={students.data?.items}
        columns={[
          {
            title: "Öğrenci",
            width: 150,
            render: (_, r) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{r.name ?? "—"}</Typography.Text>
                <Typography.Text
                  type="secondary"
                  title={r.id}
                  aria-label={`Hesap numarası: ${r.id}`}
                  style={{ fontSize: 12 }}
                  copyable={{
                    text: r.id,
                    tooltips: ["Hesap numarasını kopyala", "Kopyalandı"],
                  }}
                >
                  Hesap: {r.id.slice(0, 8)}…
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: "İletişim",
            width: 185,
            render: (_, r) => (
              <Space direction="vertical" size={2}>
                <Typography.Text>{r.email ?? "—"}</Typography.Text>
                <Typography.Text type="secondary">
                  Telegram: {r.telegramUsername ?? r.telegramId ?? "—"}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: "Katılım (UTC+5)",
            width: 155,
            render: (_, r) => (
              <Space direction="vertical" size={3}>
                <span className="student-date">{joinedTime(r.createdAt)}</span>
                {r.registrationOrigin?.countryCode && (
                  <Typography.Text
                    type="secondary"
                    className="student-origin-location"
                  >
                    {registrationLocation(r.registrationOrigin)}
                  </Typography.Text>
                )}
              </Space>
            ),
          },
          {
            title: "Kaynak",
            width: 150,
            render: (_, r) => (
              <Space direction="vertical" size={3}>
                <Typography.Text>
                  {registrationSourceLabel(r.registrationOrigin)}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  className="student-origin-method"
                >
                  Kayıt: {registrationMethodLabel(r.signupMethod)}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: "Üyelik",
            width: 110,
            render: (_, r) => (
              <Tag color={r.membership === "ACTIVE" ? "green" : undefined}>
                {
                  {
                    ACTIVE: "Aktif",
                    EXPIRED: "Süresi dolmuş",
                    NONE: "Üyelik yok",
                    SCHEDULED: "Planlandı",
                  }[r.membership ?? "NONE"]
                }
              </Tag>
            ),
          },
          {
            title: "İşlem",
            width: 140,
            fixed: "right",
            render: (_, r) => (
              <Button onClick={() => navigate(`/students/${r.id}`)}>
                Hesabı yönet
              </Button>
            ),
          },
        ]}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: students.data?.total ?? 0,
          pageSizeOptions: [25, 50, 100],
          showSizeChanger: true,
          showTotal: (total) => `${total} öğrenci`,
          onChange: (page, limit) => setFilters({ ...filters, page, limit }),
        }}
      />
    </>
  );
}

export default function Students() {
  const [tab, setTab] = useState("all");
  return (
    <Card className="student-management" title="Öğrenciler">
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "all", label: "Tüm öğrenciler" },
          { key: "live", label: "Canlı" },
        ]}
      />
      {tab === "live" ? <StudentLiveTable /> : <StudentDirectory />}
    </Card>
  );
}
