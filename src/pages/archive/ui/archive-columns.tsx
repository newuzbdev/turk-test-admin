import { Button, Space, Tag } from "antd";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import type { Test } from "@/utils/types/types";

interface ArchiveColumnsProps {
  onRestore: (id: string) => void;
  onCopyId: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ArchiveColumns = ({
  onRestore,
  onCopyId,
  onDelete,
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
      width: 200,
      fixed: "right" as const,
      render: (_: any, record: Test) => (
        <Space size="middle" className="w-full justify-end">
          <Button
            type="primary"
            size="middle"
            icon={<RotateCcw size={16} />}
            onClick={() => onRestore(record.id!)}
            title="Qayta tiklash"
            className="min-w-[100px]"
          >
            Qayta tiklash
          </Button>
          <Button
            size="middle"
            icon={<Copy size={16} />}
            onClick={() => onCopyId(record.id!)}
            title="ID nusxalash"
            className="min-w-[40px]"
          />
          {onDelete && (
            <Button
              danger
              size="middle"
              icon={<Trash2 size={16} />}
              onClick={() => onDelete(record.id!)}
              title="Butunlay o'chirish"
              className="min-w-[40px]"
            />
          )}
        </Space>
      ),
    },
  ];
};
