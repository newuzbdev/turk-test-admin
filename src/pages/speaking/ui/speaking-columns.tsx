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
        <span className="font-medium">{title}</span>
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
        <span>
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
            size="large"
            icon={<SettingOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                navigate(`/speaking/${record.id}/edit`);
              }
            }}
            title="Open Editor"
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />

          <Button
            size="large"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(record);
            }}
            title="Edit"
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />

          <Button
            size="large"
            icon={<Copy size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                onCopyId(record.id);
              }
            }}
            title="Copy ID"
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />

          <Button
            danger
            size="large"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              console.log("=== DELETE BUTTON CLICKED ===");
              console.log("Delete button clicked for record:", record);

              if (record.id) {
                console.log("Calling onDelete with ID:", record.id);
                onDelete(record.id);
              } else {
                console.error("No ID found in record:", record);
              }
            }}
            title="Delete"
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </Space>
      ),
    },
  ];
};
