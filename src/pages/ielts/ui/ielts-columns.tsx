import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import { Copy } from "lucide-react";
import type { IELTS } from "@/utils/types/types";

interface IeltsColumnsProps {
  onEdit: (data: IELTS) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string) => void;
}

export const IeltsColumns = ({
  onEdit,
  onDelete,
  onCopyId,
}: IeltsColumnsProps) => [
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
    render: (record: IELTS) => (
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
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            console.log("Delete button clicked, record:", record); // Debug log
            if (record.id) {
              onDelete(record.id);
            } else {
              console.error("Record has no ID:", record);
            }
          }}
        />
      </Space>
    ),
  },
];
