import {
    Button,
    Form,
    Input,
    Modal,
    Space,
    Table,
    Typography,
    Popconfirm,
} from 'antd';
import { useState } from 'react';
import {
    useGetIeltsList,
    useCreateIelts,
    useUpdateIelts,
    useDeleteIelts,
    type IeltsItem,
} from '../../config/querys/Ielts-query';

const { Title } = Typography;

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
            title: 'Sarlavha',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Yaratilgan',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: 'Amallar',
            key: 'actions',
            render: (_: any, record: IeltsItem) => (
                <Space>
                    <Button type="link" onClick={() => handleEdit(record)}>
                        Tahrirlash
                    </Button>
                    <Popconfirm
                        title="Haqiqatan ham o'chirmoqchimisiz?"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="link" danger>
                            O‘chirish
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Title level={3}>IELTS Ro‘yxati</Title>
            <Button
                type="primary"
                onClick={() => {
                    setModalOpen(true);
                    form.resetFields();
                    setEditingItem(null);
                }}
                style={{ marginBottom: 16 }}
            >
                Yangi IELTS qo‘shish
            </Button>

            <Table
                columns={columns}
                dataSource={data?.data || []}
                rowKey="id"
                loading={isLoading}
                pagination={{
                    total: data?.total,
                    pageSize: data?.limit,
                    current: data?.page,
                }}
            />

            <Modal
                title={editingItem ? "IELTSni tahrirlash" : "Yangi IELTS qo‘shish"}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setEditingItem(null);
                }}
                onOk={() => form.submit()}
                okText={editingItem ? 'Yangilash' : 'Yaratish'}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="title"
                        label="Sarlavha"
                        rules={[{ required: true, message: "Iltimos, sarlavhani kiriting!" }]}
                    >
                        <Input placeholder="Masalan: IELTS Mock Test 1" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
