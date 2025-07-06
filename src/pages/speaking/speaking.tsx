// src/pages/Speaking.tsx
import {
    Button,
    Card,
    Layout,
    Modal,
    Space,
    Table,
    Typography,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useState } from "react";

import SpeakingForm from "./ui/speaking-form";
import type { SpeakingTest } from "../../utils/types/types";
import { useCreateSpeakingTest, useDeleteSpeakingTest, useGetSpeakingList, useUpdateSpeakingTest } from "../../config/querys/speaking-query";

const { Content } = Layout;
const { Title } = Typography;

export default function speaking() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isModal, setIsModal] = useState(false);
    const [editing, setEditing] = useState<SpeakingTest | null>(null);
    const [delModal, setDelModal] = useState(false);
    const [delId, setDelId] = useState<string | null>(null);

    const { data, isLoading } = useGetSpeakingList(page, limit);
    const create = useCreateSpeakingTest();
    const update = useUpdateSpeakingTest();
    const remove = useDeleteSpeakingTest();

    const handleSubmit = (payload: Omit<SpeakingTest, "id" | "createdAt" | "updatedAt">) => {
        editing
            ? update.mutate({ id: editing.id, ...payload })
            : create.mutate(payload);
        setIsModal(false);
        setEditing(null);
    };

    const rows = data?.data || [];
    const total = data?.total || 0;

    const columns = [
        { title: "Nomi", dataIndex: "title", key: "title" },
        {
            title: "IELTS ID",
            dataIndex: "ieltsId",
            key: "ieltsId",
            render: (s: string) => <code>{s}</code>,
        },

        {
            title: "Bo‘limlar",
            dataIndex: "sections",
            key: "sections",
            render: (s: SpeakingTest["sections"]) => s.length,
        },
        {
            title: "Amallar",
            key: "actions",
            render: (_: any, rec: SpeakingTest) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => { setEditing(rec); setIsModal(true); }}
                    >
                        Tahrirlash
                    </Button>
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => { setDelId(rec.id); setDelModal(true); }}
                    >
                        O‘chirish
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Layout>
            <Content style={{ padding: 24 }}>
                <Card style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 20 }}>
                        <Title level={3}>🎤 Speaking Testlar</Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => { setEditing(null); setIsModal(true); }}
                        >
                            Yangi Test
                        </Button>
                    </Space>

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

                {/* O‘chirish tasdiq modal */}
                <Modal
                    open={delModal}
                    title="Testni o'chirmoqchimisiz?"
                    okText="Ha, o'chirish"
                    cancelText="Bekor"
                    onOk={() => delId && remove.mutate(delId, { onSuccess: () => setDelModal(false) })}
                    onCancel={() => setDelModal(false)}
                >
                    <p>Bu amalni qaytarib bo‘lmaydi.</p>
                </Modal>

                {/* Yaratish/Tahrirlash form modal */}
                <Modal
                    title={editing ? "Tahrirlash" : "Yangi Speaking Test"}
                    visible={isModal}
                    width={900}
                    footer={null}
                    onCancel={() => setIsModal(false)}
                >
                    <SpeakingForm
                        initialData={editing ?? undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => setIsModal(false)}
                    />
                </Modal>
            </Content>
        </Layout>
    );
}
