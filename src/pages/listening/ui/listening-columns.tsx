import {
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Space } from "antd";
import { Copy } from "lucide-react";
import type { Test } from "@/utils/types/types";
import { useNavigate } from "react-router-dom";

interface ListeningColumnsProps {
  onEdit: (data: Test) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string) => void;
}

export const ListeningColumns = ({
  onEdit,
  onDelete,
  onCopyId,
}: ListeningColumnsProps) => {
  const navigate = useNavigate();

  return [
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
          onClick={(e) => {
            e.stopPropagation();
            onCopyId(id);
          }}
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
      key: "type",
      title: "Turi",
      dataIndex: "type",
      render: (type: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
          {type}
        </span>
      ),
    },
    {
      key: "ielts",
      title: "IELTS Test",
      dataIndex: "ielts",
      render: (ielts: any) => ielts?.title || "N/A",
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
            icon={<SettingOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                navigate(`/listening/${record.id}/edit`);
              }
            }}
            title="Open Editor"
          />

          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(record);
            }}
            title="Edit Details"
          />

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                onDelete(record.id);
              } else {
                console.error("Record has no ID:", record);
              }
            }}
            title="Delete Test"
          />
        </Space>
      ),
    },
  ];
};
