import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Space, Tag } from "antd";
import { Copy, Eye, Volume2 } from "lucide-react";
import type { Test } from "@/utils/types/types";
import type { NavigateFunction } from "react-router-dom";

interface ListeningColumnsProps {
  onEdit: (data: Test) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  navigate: NavigateFunction;
}

export const ListeningColumns = ({
  onEdit,
  onDelete,
  onCopyId,
  navigate,
}: ListeningColumnsProps) => [
  {
    key: "#",
    title: "#",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (_: any, _rec: any, index: number) => index + 1,
  },
  {
    key: "id",
    title: "ID",
    dataIndex: "id",
    className: "w-20",
    render: (id: string) => (
      <Button
        type="link"
        icon={<Copy size={16} />}
        onClick={(e) => onCopyId(id, e)}
        style={{ padding: 0 }}
      >
        <span className="text-start truncate w-20">{id}</span>
      </Button>
    ),
  },
  {
    key: "title",
    title: "Test Nomi",
    dataIndex: "title",
  },
  {
    key: "type",
    title: "Turi",
    dataIndex: "type",
    render: (type: string) => (
      <Tag color={type === "LISTENING" ? "orange" : "default"} icon={<Volume2 size={14} />}>
        {type}
      </Tag>
    ),
  },
  {
    key: "ieltsId",
    title: "IELTS ID",
    dataIndex: "ieltsId",
    render: (ieltsId: string) => (
      <span className="text-xs text-gray-500">{ieltsId}</span>
    ),
  },
  {
    key: "createdAt",
    title: "Yaratilgan sana",
    dataIndex: "createdAt",
    render: (date: string) => new Date(date).toLocaleDateString("uz-UZ"),
  },
  {
    key: "updatedAt",
    title: "Yangilangan sana",
    dataIndex: "updatedAt",
    render: (date: string) => new Date(date).toLocaleDateString("uz-UZ"),
  },
  {
    key: "actions",
    title: "Amallar",
    render: (record: Test) => (
      <Space>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(record);
          }}
        />
        <Button
          icon={<Eye />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/listening/${record.id}`);
          }}
        />
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(record.id!);
          }}
        />
      </Space>
    ),
  },
];
