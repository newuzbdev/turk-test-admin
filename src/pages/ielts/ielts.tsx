import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Typography,
  Card,
  Layout,
} from "antd";
import { useState } from "react";
import {
  useGetIeltsList,
  useCreateIelts,
  useUpdateIelts,
  useDeleteIelts,
  type IeltsItem,
} from "../../config/querys/Ielts-query";
import {
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { message } from "antd";

const { Title } = Typography;
const { Content } = Layout;

export default function IELTSPage() {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IeltsItem | null>(null);

  const { data, isLoading } = useGetIeltsList();
  const createIelts = useCreateIelts();
  const updateIelts = useUpdateIelts();
  const deleteIelts = useDeleteIelts();

  const handleSubmit = (values: { title: string }) => {
    if (editingItem) {
      updateIelts.mutate({ ...values, id: editingItem.id });
    } else {
      createIelts.mutate(values);
    }
    form.resetFields();
    setEditingItem(null);
    setModalOpen(false);
  };

  const handleEdit = (record: IeltsItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteIelts.mutate(id);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (text: string) => (
        <Space>
          <code>{text}</code>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(text);
              message.success("ID nusxalandi!");
            }}
          />
        </Space>
      ),
    },
    {
      title: "Sarlavha",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Yaratilgan",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "Amallar",
      key: "actions",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: IeltsItem) => (
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
            <Title level={3}>IELTS Ro'yxati</Title>
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
                setModalOpen(true);
                form.resetFields();
                setEditingItem(null);
              }}
            >
              Yangi IELTS Yaratish
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              total: data?.total,
              pageSize: data?.limit,
              current: data?.page,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total} ta test`,
            }}
          />
        </Card>

        <Modal
          title={editingItem ? "IELTSni tahrirlash" : "Yangi IELTS qo'shish"}
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onOk={() => form.submit()}
          okText={editingItem ? "Yangilash" : "Yaratish"}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="title"
              label="Sarlavha"
              rules={[
                { required: true, message: "Iltimos, sarlavhani kiriting!" },
              ]}
            >
              <Input placeholder="Masalan: IELTS Mock Test 1" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
