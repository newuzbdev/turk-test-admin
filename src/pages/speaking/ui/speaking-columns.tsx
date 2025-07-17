import {
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Space } from "antd";
import { Copy } from "lucide-react";
import type { SpeakingTest } from "@/utils/types/types";
import { useNavigate } from "react-router-dom";

interface SpeakingColumnsProps {
  onEdit: (data: SpeakingTest) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string) => void;
}

export const SpeakingColumns = ({
  onEdit,
  onDelete,
  onCopyId,
}: SpeakingColumnsProps) => {
  const navigate = useNavigate();

  return [
    {
      key: "title",
      title: "Test nomi",
      dataIndex: "title",
      render: (title: string) => (
        <span className="font-medium text-gray-900">{title}</span>
      ),
    },
    {
      key: "ielts",
      title: "IELTS",
      dataIndex: "ielts",
      render: (ielts: any) => (
        <span className="text-blue-600 font-medium">
          {ielts?.title || "N/A"}
        </span>
      ),
    },
    {
      key: "sectionsCount",
      title: "Sectionlar soni",
      render: (record: SpeakingTest) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {record.sections?.length || 0}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "Yaratilgan sana",
      dataIndex: "createdAt",
      render: (date: string) => (
        <span className="text-gray-600">
          {new Date(date).toLocaleDateString("uz-UZ")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Amallar",
      render: (record: SpeakingTest) => (
        <Space>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                navigate(`/speaking/${record.id}/edit`);
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
            title="Edit"
          />

          <Button
            icon={<Copy size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                onCopyId(record.id);
              }
            }}
            title="Copy ID"
          />

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                onDelete(record.id);
              }
            }}
            title="Delete"
          />
        </Space>
      ),
    },
  ];
};
