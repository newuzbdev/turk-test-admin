import { Button, Card, Input, Modal, Space, Table, Typography } from "antd";
import { useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  useCreateTest,
  useDeleteTest,
  useGetTestList,
  useUpdateTest,
  type CreateTestDto,
  type TestItem,
} from "../../config/querys/test-query";

const { Title } = Typography;

export default function TestPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [formData, setFormData] = useState<CreateTestDto>({
    title: "",
    type: "LISTENING",
    ieltsId: "",
    parts: [],
  });

  const { data, isLoading } = useGetTestList(page, limit);
  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();
  const deleteMutation = useDeleteTest();

  const handleEdit = (record: TestItem) => {
    setEditingTest(record);
    setFormData({
      title: record.title,
      type: record.type,
      ieltsId: record.ieltsId,
      parts: record.parts,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Ishonchingiz komilmi?",
      content: "Bu testni o'chirishni xohlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      onOk: () => deleteMutation.mutate(id),
      onCancel: () => {},
    });
  };

  const handleSubmit = () => {
    if (editingTest) {
      updateMutation.mutate({ id: editingTest.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
    setIsModalOpen(false);
    setEditingTest(null);
    setFormData({ title: "", type: "LISTENING", ieltsId: "", parts: [] });
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <Title level={3}>Testlar</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{
            borderRadius: "8px",
            // background: "#10b981",
            borderColor: "#10b981",
            height: "44px",
            paddingLeft: "20px",
            paddingRight: "20px",
          }}
          onClick={() => setIsModalOpen(true)}
        >
          Yangi Test Yaratish
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
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total} ta test`,
        }}
      />

      <Modal
        title={editingTest ? "Testni tahrirlash" : "Yangi test yaratish"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
      >
        <Input
          placeholder="Test nomi"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={{ marginBottom: 10 }}
        />
        <Input
          placeholder="IELTS ID"
          value={formData.ieltsId}
          onChange={(e) =>
            setFormData({ ...formData, ieltsId: e.target.value })
          }
          style={{ marginBottom: 10 }}
        />
        <Input
          placeholder="Turi (LISTENING/READING)"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        />
      </Modal>
    </Card>
  );
}
