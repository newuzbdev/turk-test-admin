import { Button, Card, Modal, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import {
    useCreateTest,
    useDeleteTest,
    useGetTestList,
    useUpdateTest,
    type CreateTestDto,
    type TestItem,
} from '../../config/querys/test-query';
import ListeningForm from '../../components/test/ListeningForm';

const { Title } = Typography;

export default function listening() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<TestItem | null>(null);

    const { data, isLoading } = useGetTestList(page, limit);
    const createMutation = useCreateTest();
    const updateMutation = useUpdateTest();
    const deleteMutation = useDeleteTest();

    const handleEdit = (record: TestItem) => {
        setEditingTest(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Testni o‘chirmoqchimisiz?',
            onOk: () => deleteMutation.mutate(id),
        });
    };

    const handleSubmit = (data: CreateTestDto) => {
        if (editingTest) {
            updateMutation.mutate({ id: editingTest.id, ...data });
        } else {
            createMutation.mutate(data);
        }
        setIsModalOpen(false);
        setEditingTest(null);
    };

    const columns = [
        { title: 'Test nomi', dataIndex: 'title', key: 'title' },
        { title: 'Turi', dataIndex: 'type', key: 'type' },
        { title: 'IELTS ID', dataIndex: 'ieltsId', key: 'ieltsId' },
        {
            title: 'Amallar',
            key: 'actions',
            render: (_: any, record: TestItem) => (
                <Space>
                    <Button onClick={() => handleEdit(record)}>✏️ Tahrirlash</Button>
                    <Button danger onClick={() => handleDelete(record.id)}>🗑 O‘chirish</Button>
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4}>Listening Testlar</Title>
                <Button type='primary' onClick={() => {
                    setEditingTest(null);
                    setIsModalOpen(true);
                }}>
                    ➕ Yangi Test
                </Button>
            </Space>

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

            <Modal
                title={editingTest ? 'Testni tahrirlash' : 'Yangi Test yaratish'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={1000}
            >
                <ListeningForm
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
                />
            </Modal>
        </Card>
    );
}
