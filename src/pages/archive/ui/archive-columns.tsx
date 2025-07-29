import { Button, Space, Tag } from "antd";
import { Copy, RotateCcw } from "lucide-react";
import type { Test } from "@/utils/types/types";

interface ArchiveColumnsProps {
  onRestore: (id: string) => void;
  onCopyId: (id: string) => void;
}

export const ArchiveColumns = ({
  onRestore,
  onCopyId,
}: ArchiveColumnsProps) => {
  return [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      width: 50,
      fixed: "left" as const,
    },
    {
      title: "Test nomi",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Turi",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => {
        const color = type === "LISTENING" ? "blue" : "green";
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "Yaratilgan sana",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => {
        return date ? new Date(date).toLocaleDateString("uz-UZ") : "-";
      },
    },
    {
      title: "O'chirilgan sana",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (date: string) => {
        return date ? new Date(date).toLocaleDateString("uz-UZ") : "-";
      },
    },
    {
      title: "Amallar",
      key: "actions",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: Test) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<RotateCcw size={14} />}
            onClick={() => onRestore(record.id!)}
            title="Qayta tiklash"
          >
            Qayta tiklash
          </Button>
          <Button
            size="small"
            icon={<Copy size={14} />}
            onClick={() => onCopyId(record.id!)}
            title="ID nusxalash"
          />
        </Space>
      ),
    },
  ];
};
