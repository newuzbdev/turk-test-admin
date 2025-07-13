import React, { useState } from "react";
import { Table, Button, Space, Typography, Card, Tag, Modal } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useListeningModalStore } from "../utils/listening-modal-store";
import { showNotification } from "../../../shared/utils/notification";
import type { CreateTestDto } from "../../../config/querys/test-query";
import { ListeningModal } from "./listening-modal";

const { Title } = Typography;

// Mock data for demonstration
const mockListeningTests: CreateTestDto[] = [
  {
    title: "IELTS Listening Test 1",
    description: "Academic listening test with 4 parts",
    type: "LISTENING",
    ieltsId: "ielts-1",
    parts: [
      {
        number: 1,
        title: "Conversation",
        audioUrl: "audio1.mp3",
        sections: [],
      },
    ],
  },
  {
    title: "IELTS Listening Test 2",
    description: "General training listening test",
    type: "LISTENING",
    ieltsId: "ielts-2",
    parts: [],
  },
];

export const ListeningTable = () => {
  const { onOpen } = useListeningModalStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleEdit = (record: CreateTestDto) => {
    onOpen(record);
    showNotification.info({
      message: "Test tahrirlash",
      description: `"${record.title}" testi tahrirlash uchun ochildi`,
    });
  };

  const handleDelete = (record: CreateTestDto) => {
    Modal.confirm({
      title: "Testni o'chirish",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <p>
            Haqiqatan ham <strong>"{record.title}"</strong> testini
            o'chirmoqchimisiz?
          </p>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Bu amal qaytarib bo'lmaydi va test butunlay o'chiriladi.
          </p>
        </div>
      ),
      okText: "Ha, o'chirish",
      cancelText: "Bekor qilish",
      okType: "danger",
      onOk() {
        // TODO: Implement actual delete API call
        console.log("Deleting listening test:", record);

        showNotification.success({
          message: "Test o'chirildi",
          description: `"${record.title}" testi muvaffaqiyatli o'chirildi`,
        });
      },
      onCancel() {
        showNotification.info({
          message: "O'chirish bekor qilindi",
          description: "Test o'chirilmadi",
        });
      },
    });
  };

  const columns = [
    {
      title: "Test Nomi",
      dataIndex: "title",
      key: "title",
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <PlayCircleOutlined style={{ color: "#1890ff", fontSize: "16px" }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </div>
      ),
    },
    {
      title: "Tavsif",
      dataIndex: "description",
      key: "description",
      render: (text: string) => <span style={{ color: "#666" }}>{text}</span>,
    },
    {
      title: "Qismlar soni",
      key: "partsCount",
      render: (record: CreateTestDto) => (
        <Tag color="blue">{record.parts.length} ta qism</Tag>
      ),
    },
    {
      title: "Turi",
      dataIndex: "type",
      key: "type",
      render: () => (
        <Tag color="cyan" icon={<PlayCircleOutlined />}>
          LISTENING
        </Tag>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (record: CreateTestDto) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Tahrirlash
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            O'chirish
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              🎧 Listening Testlar
            </Title>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              Listening testlarini boshqaring va yangi test yarating
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => onOpen()}
            style={{
              background: "#1890ff",
              borderColor: "#1890ff",
              height: "48px",
              paddingLeft: "24px",
              paddingRight: "24px",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Yangi Listening Test Qo'shish
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={mockListeningTests}
          rowKey="title"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: mockListeningTests.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total} ta test`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          style={{
            background: "white",
            borderRadius: "8px",
          }}
        />
      </Card>

      <ListeningModal />
    </div>
  );
};
