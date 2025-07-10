import { Button, Card, Layout, Typography, Table, Space, Modal } from "antd";
import { useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  useGetTestList,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
  type TestItem,
  type CreateTestDto,
} from "../../config/querys/test-query";
import ListeningForm from "./ui/listening-form";

const { Title } = Typography;
const { Content } = Layout;

export default function Listening() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const { data, isLoading } = useGetTestList(page, limit, "LISTENING");
  const create = useCreateTest();
  const update = useUpdateTest();
  const remove = useDeleteTest();

  const handleEdit = (record: TestItem) => {
    setEditingTest(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTestId(id);
    setDeleteModalOpen(true);
  };

  const handleSubmit = (form: CreateTestDto) => {
    if (editingTest) {
      update.mutate(
        {
          id: editingTest.id,
          ...form,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingTest(null);
          },
        }
      );
    } else {
      setIsModalOpen(false);
    }
  };

  const columns = [
    {
      title: "Test nomi",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "IELTS ID",
      dataIndex: "ieltsId",
      key: "ieltsId",
      render: (id: string) => <code>{id}</code>,
    },
    {
      title: "Bo‘limlar",
      dataIndex: "parts",
      key: "parts",
      render: (parts: any[]) => parts?.length || 0,
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_: any, record: TestItem) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Tahrirlash
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            O'chirish
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Content>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Title level={3}>🎧 Listening Testlar</Title>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                setEditingTest(null);
                setIsModalOpen(true);
              }}
            >
              Listening test yaratish
            </Button>
          </div>

          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data?.data || []}
            columns={columns}
            pagination={{
              current: page,
              pageSize: limit,
              total: data?.total || 0,
              onChange: setPage,
            }}
          />
        </Card>

        <Modal
          open={deleteModalOpen}
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

        <Modal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={1200}
        >
          <ListeningForm
            initialData={
              editingTest
                ? {
                    id: editingTest.id,
                    title: editingTest.title,
                    ieltsId: editingTest.ieltsId,
                    type: editingTest.type,
                    parts: editingTest.parts,
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
