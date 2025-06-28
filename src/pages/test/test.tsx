import { Button, Card, Input, Modal, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import {
    useCreateTest,
    useDeleteTest,
    useGetTestList,
    useUpdateTest,
    type CreateTestDto,
    type TestItem,
} from '../../config/querys/test-query';

const { Title } = Typography;

export default function TestPage() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<TestItem | null>(null);
    const [formData, setFormData] = useState<CreateTestDto>({
        title: '',
        type: 'LISTENING',
        ieltsId: '',
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
            title: 'Testni o\'chirmoqchimisiz?',
            onOk: () => deleteMutation.mutate(id),
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
        setFormData({ title: '', type: 'LISTENING', ieltsId: '', parts: [] });
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'IELTS ID',
            dataIndex: 'ieltsId',
            key: 'ieltsId',
        },
        {
            title: 'Amallar',
            key: 'actions',
            render: (_: any, record: TestItem) => (
                <Space>
                    <Button onClick={() => handleEdit(record)}>Tahrirlash</Button>
                    <Button danger onClick={() => handleDelete(record.id)}>O'chirish</Button>
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4}>Testlar</Title>
                <Button type='primary' onClick={() => setIsModalOpen(true)}>
                    Yangi Test
                </Button>
            </Space>

            <Table
                rowKey='id'
                loading={isLoading}
                dataSource={data?.data || []}
                columns={columns}
                pagination={{ current: page, pageSize: limit, total: data?.total || 0, onChange: setPage }}
            />

            <Modal
                title={editingTest ? 'Testni tahrirlash' : 'Yangi test yaratish'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Input
                    placeholder='Test nomi'
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ marginBottom: 10 }}
                />
                <Input
                    placeholder='IELTS ID'
                    value={formData.ieltsId}
                    onChange={(e) => setFormData({ ...formData, ieltsId: e.target.value })}
                    style={{ marginBottom: 10 }}
                />
                <Input
                    placeholder='Turi (LISTENING/READING)'
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
            </Modal>
        </Card>
    );
}
