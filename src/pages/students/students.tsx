import { Alert, Button, Card, Input, Table, Tabs } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents } from "@/config/queries/students";
import { useAccessConfig } from "@/config/queries/access";
import StudentLiveTable from "./student-live-table";
function StudentDirectory() {
  const [filters, setFilters] = useState({ q: "", page: 1, limit: 25 });
  const students = useStudents(filters);
  const config = useAccessConfig();
  const navigate = useNavigate();
  return (
    <>
      <Input.Search
        aria-label="Öğrenci ara"
        placeholder="Ad, e-posta veya Telegram"
        onSearch={(q) => setFilters({ ...filters, q, page: 1 })}
      />
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
        rowKey="id"
        loading={students.isLoading || config.isLoading}
        dataSource={students.data?.items}
        columns={[
          { title: "Ad", dataIndex: "name" },
          { title: "E-posta", dataIndex: "email" },
          {
            title: "Telegram",
            render: (_, r) => r.telegramUsername ?? r.telegramId,
          },
          {
            title: "İşlem",
            render: (_, r) => (
              <Button onClick={() => navigate(`/students/${r.id}`)}>
                Erişimler
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
          onChange: (page, limit) => setFilters({ ...filters, page, limit }),
        }}
      />
    </>
  );
}

export default function Students() {
  const [tab, setTab] = useState("all");
  return (
    <Card title="Öğrenciler">
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
