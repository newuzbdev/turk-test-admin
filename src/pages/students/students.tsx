import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Table,
  Tabs,
  Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents } from "@/config/queries/students";
import { useAccessConfig } from "@/config/queries/access";
import StudentLiveTable from "./student-live-table";
import "./students.css";
function StudentDirectory() {
  const [filters, setFilters] = useState({ q: "", page: 1, limit: 25 });
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
        <Typography.Text type="secondary">
          {students.data ? `${students.data.total} öğrenci` : ""}
        </Typography.Text>
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
        scroll={{ x: 760 }}
        locale={{ emptyText: "Aramaya uygun öğrenci bulunamadı." }}
        rowKey="id"
        loading={students.isLoading || config.isLoading}
        dataSource={students.data?.items}
        columns={[
          {
            title: "Öğrenci",
            width: 260,
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
            title: "İşlem",
            width: 150,
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
