import {
    Button,
    Card,
    Layout,
    Typography,
    Table,
    Space,
    Modal,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import {
    useCreateWritingTest,
    useDeleteWritingTest,
    useGetWritingTests,
    useUpdateWritingTest,
    type WritingTest,
    type WritingTestPayload,
} from "../../config/querys/writing-query";
import WritingForm from "./ui/writing-form";

const { Title } = Typography;
const { Content } = Layout;

export default function writing() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<WritingTest | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

    const { data, isLoading } = useGetWritingTests(page, limit);
    const createMutation = useCreateWritingTest();
    const updateMutation = useUpdateWritingTest();
    const deleteMutation = useDeleteWritingTest();

    const handleSubmit = (values: WritingTestPayload) => {
        if (editingTest) {
            updateMutation.mutate({ id: editingTest.id, ...values });
        } else {
            createMutation.mutate(values);
        }
        setIsModalOpen(false);
        setEditingTest(null);
    };

    const handleEdit = (record: WritingTest) => {
        setEditingTest(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteTestId(id);
        setDeleteModalOpen(true);
    };

    const columns = [
        {
            title: "Test nomi",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Task 1 sarlavha",
            dataIndex: "task1Title",
            key: "task1Title",
        },
        {
            title: "Task 2 sarlavha",
            dataIndex: "task2Title",
            key: "task2Title",
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
            render: (_: any, record: WritingTest) => (
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
                <Card style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 24,
                        }}
                    >
                        <Title level={3}>📝 Writing Testlar</Title>
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
                            Yangi Writing Yaratish
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
                                `${range[0]}-${range[1]} / ${total} ta writing`,
                        }}
                    />
                </Card>

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
                    <p>Bu amalni bekor qilib bo‘lmaydi.</p>
                </Modal>

                <Modal
                    open={isModalOpen}
                    footer={null}
                    title={editingTest ? "Writing Testni tahrirlash" : "Yangi Writing Test"}
                    onCancel={() => setIsModalOpen(false)}
                    width={800}
                >
                    <WritingForm
                        initialValues={editingTest || undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            </Content>
        </Layout>
    );
}
