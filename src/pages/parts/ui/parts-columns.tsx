import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import { Copy, Eye } from "lucide-react";
import type { Part } from "@/utils/types/types";
import type { NavigateFunction } from "react-router-dom";

interface PartsColumnsProps {
  onEdit: (data: Part) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  navigate: NavigateFunction;
}

export const PartsColumns = ({
  onEdit,
  onDelete,
  onCopyId,
  navigate,
}: PartsColumnsProps) => [
  {
    key: "#",
    title: "#",
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
    title: "Nomi",
    dataIndex: "title",
  },
  {
    key: "order",
    title: "Tartib",
    dataIndex: "order",
  },
  {
    key: "testId",
    title: "Test ID",
    dataIndex: "testId",
    render: (testId: string) => (
      <span className="text-xs text-gray-500">{testId}</span>
    ),
  },
  {
    key: "createdAt",
    title: "Yaratilgan sana",
    dataIndex: "createdAt",
    render: (date: string) => new Date(date).toLocaleDateString("uz-UZ"),
  },
  {
    key: "actions",
    title: "Amallar",
    render: (record: Part) => (
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
            navigate(`/parts/${record.id}`);
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
