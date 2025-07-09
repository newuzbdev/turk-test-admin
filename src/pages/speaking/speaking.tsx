import { Button, Card, Layout, Typography, Table, Space, Modal } from "antd";
import { useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

import {
  useGetSpeakingList,
  useCreateSpeakingTest,
  useUpdateSpeakingTest,
  useDeleteSpeakingTest,
} from "../../config/querys/speaking-query";
import type { SpeakingTest } from "../../utils/types/types";
import SpeakingForm from "./ui/speaking-form";

const { Title } = Typography;
const { Content } = Layout;

export default function Speaking() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<SpeakingTest | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const { data, isLoading } = useGetSpeakingList(page, limit);
  const create = useCreateSpeakingTest();
  const update = useUpdateSpeakingTest();
  const remove = useDeleteSpeakingTest();

  const handleEdit = (record: SpeakingTest) => {
    setEditingTest(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTestId(id);
    setDeleteModalOpen(true);
  };

  const handleSubmit = (form: any) => {
    if (editingTest) {
      update.mutate(
        {
          id: editingTest.id,
          ...form,
          ieltsId: form.ieltsId ?? editingTest.ielts?.id,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingTest(null);
          },
        }
      );
    } else {
      create.mutate(form, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    }
  };

  const rows = data?.data || [];
  const total = data?.total || 0;

  const columns = [
    {
      title: "Test nomi",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "IELTS ID",
      dataIndex: "ielts",
      key: "ielts",
      render: (ielts: any) => <code>{ielts?.id}</code>,
    },
    {
      title: "Bo‘limlar",
      dataIndex: "sections",
      key: "sections",
      render: (sections: any[]) => sections?.length || 0,
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_: any, record: SpeakingTest) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: "#1890ff" }}
          >
            Tahrirlash
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            O‘chirish
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Content>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Title level={3}>🎤 Speaking Testlar</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTest(null);
                setIsModalOpen(true);
              }}
            >
              Speaking test yaratish
            </Button>
          </div>

          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={rows}
            columns={columns}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              onChange: setPage,
              showQuickJumper: true,
            }}
          />
        </Card>

        {/* Delete confirm modal */}
        <Modal
          open={deleteModalOpen}
          title="Testni o'chirmoqchimisiz?"
          onCancel={() => setDeleteModalOpen(false)}
          onOk={() => {
            if (deleteTestId) {
              remove.mutate(deleteTestId, {
                onSuccess: () => {
                  setDeleteModalOpen(false);
                  setDeleteTestId(null);
                },
              });
            }
          }}
          okText="Ha, o'chirish"
          cancelText="Bekor qilish"
        >
          <p>Bu amalni qaytarib bo‘lmaydi.</p>
        </Modal>

        {/* Form modal */}
        <Modal
          title={
            editingTest
              ? "Speaking testni tahrirlash"
              : "Speaking test yaratish"
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={1200}
          style={{ top: 20 }}
        >
          <SpeakingForm
            initialData={
              editingTest
                ? {
                    speakingTestId: editingTest.id,
                    title: editingTest.title,
                    ieltsId: editingTest.ielts?.id || "",
                    sections: editingTest.sections || [],
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      </Content>
    </Layout>
  );
}
