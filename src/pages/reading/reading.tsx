
import { Button, Card, Layout, Typography, Table, Space, Modal } from "antd";
import { useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  useCreateTest,
  useDeleteTest,
  useGetTestList,
  useUpdateTest,
  type CreateTestDtoAudio,
  type TestItem,
} from "../../config/querys/test-query";
import ReadingForm from "./ui/reading-form";

const { Title } = Typography;
const { Content } = Layout;

export default function Reading() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const { data, isLoading } = useGetTestList(page, limit, "READING");
  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();
  const deleteMutation = useDeleteTest();

  const readingData = (data?.data || []).filter(
    (item: any) => item.type === "READING"
  );

  const handleEdit = (record: TestItem) => {
    setEditingTest(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTestId(id);
    setDeleteModalOpen(true);
  };

  const handleSubmit = () => {
    setIsModalOpen(false);
    setEditingTest(null);
  };

  const columns = [
    {
      title: "Test nomi",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Turi",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <span>{type}</span>,
    },
    {
      title: "IELTS ID",
      dataIndex: "ieltsId",
      key: "ieltsId",
      render: (text: string) => <code>{text}</code>,
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
            O'chirish
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
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <Title level={3}>📖 Reading Testlar</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              style={{
                borderRadius: "8px",
                borderColor: "#10b981",
                height: "44px",
                paddingLeft: "20px",
                paddingRight: "20px",
              }}
              onClick={() => {
                setEditingTest(null);
                setIsModalOpen(true);
              }}
            >
              Yangi Reading Yaratish
            </Button>
          </div>

          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={readingData}
            columns={columns}
            pagination={{
              current: page,
              pageSize: limit,
              total: data?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total} ta test`,
            }}
          />
        </Card>

        {/* Delete confirmation */}
        <Modal
          open={deleteModalOpen}
          title="Ishonchingiz komilmi?"
          onCancel={() => setDeleteModalOpen(false)}
          onOk={() => {
            if (deleteTestId) {
              deleteMutation.mutate(deleteTestId, {
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
          <p>Bu amalni bekor qilib bo'lmaydi.</p>
        </Modal>

        <Modal
          title={null}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingTest(null);
          }}
          footer={null}
          width={1400}
          style={{ top: 20 }}
          bodyStyle={{ padding: 0 }}
        >
          <ReadingForm
            initialData={
              editingTest
                ? {
                    title: editingTest.title,
                    type: editingTest.type,
                    ieltsId: editingTest.ieltsId,
                    parts: editingTest.parts,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingTest(null);
            }}
          />
        </Modal>
      </Content>
    </Layout>
  );
}
