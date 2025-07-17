import { DeleteOutlined, EditOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import { Copy } from "lucide-react";
import type { WritingTest } from "@/utils/types/types";
import { useNavigate } from "react-router-dom";

interface WritingColumnsProps {
  onEdit: (data: WritingTest) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string) => void;
}

export const WritingColumns = ({
  onEdit,
  onDelete,
  onCopyId,
}: WritingColumnsProps) => {
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
      render: (record: WritingTest) => (
        <Space>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                navigate(`/writing/${record.id}/edit`);
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
