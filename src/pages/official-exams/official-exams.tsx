import { useState } from "react";
import { Alert, Button, Modal, Table, Tag } from "antd";
import { ExamForm } from "./exam-form";
import {
  useOfficialExams,
  useSaveExam,
  type OfficialExam,
} from "./official-exams-api";
import "./official-exams.css";
const date = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
export default function OfficialExams() {
  const query = useOfficialExams();
  const save = useSaveExam();
  const [editing, setEditing] = useState<OfficialExam | null | undefined>();
  return (
    <section className="official-exams-page">
      <header>
        <div>
          <h1>Sınav Takvimi</h1>
          <p>Millî CEFR · Türkçe</p>
        </div>
        <Button type="primary" onClick={() => setEditing(null)}>
          Dönem ekle
        </Button>
      </header>
      {query.isError && (
        <Alert
          type="error"
          message="Takvim yüklenemedi"
          action={
            <Button onClick={() => void query.refetch()}>Yeniden dene</Button>
          }
        />
      )}
      <Table<OfficialExam>
        rowKey="id"
        loading={query.isPending}
        dataSource={query.data ?? []}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 850 }}
        columns={[
          {
            title: "Sınav dönemi",
            render: (_, s) => (
              <strong>
                {date(s.examStart)} – {date(s.examEnd)}
              </strong>
            ),
          },
          {
            title: "Başvuru",
            render: (_, s) =>
              `${date(s.registrationStart)} – ${date(s.registrationEnd)}`,
          },
          { title: "Son ödeme", dataIndex: "paymentEnd", render: date },
          {
            title: "Durum",
            render: (_, s) => (
              <Tag color={s.published ? "green" : undefined}>
                {s.published ? "Yayında" : "Yayın dışı"}
              </Tag>
            ),
          },
          {
            title: "Kaynak",
            render: (_, s) => (
              <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                Resmî duyuru ↗
              </a>
            ),
          },
          {
            title: "",
            render: (_, s) => (
              <Button onClick={() => setEditing(s)}>Düzenle</Button>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? "Dönemi düzenle" : "Sınav dönemi ekle"}
        open={editing !== undefined}
        onCancel={() => {
          if (!save.isPending) setEditing(undefined);
        }}
        footer={null}
        destroyOnHidden
        closable={!save.isPending}
        maskClosable={!save.isPending}
      >
        {editing !== undefined && (
          <ExamForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            onCancel={() => setEditing(undefined)}
            onSave={async (data) => {
              await save.mutateAsync({ id: editing?.id, data });
              setEditing(undefined);
            }}
          />
        )}
      </Modal>
    </section>
  );
}
