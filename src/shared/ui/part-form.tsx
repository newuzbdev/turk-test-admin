import React from "react";
import { Button, Card, Input, Space, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import SectionForm from "./section-form";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { Part, Section } from "@/utils/types/types";

interface PartFormProps {
  part: Part;
  onChange: (part: Part) => void;
  onRemove: () => void;
}

const PartForm: React.FC<PartFormProps> = ({ part, onChange, onRemove }) => {
  const fileUploadMutation = useFileUpload();

  const handleAudioUpload = async (file: File) => {
    try {
      const result = await fileUploadMutation.mutateAsync(file);
      if (result?.path) {
        onChange({ ...part, audioUrl: result.path });
      }
    } catch (error) {
      console.error("Audio upload error:", error);
      message.error("Audio yuklashda xatolik");
    }
  };

  const updateField = (field: keyof Part, value: any) => {
    onChange({ ...part, [field]: value });
  };

  const addSection = () => {
    const newSection: Section = {
      title: "",
      type: null,
      content: "",
      imageUrl: "",
      questions: [],
    };
    onChange({ ...part, sections: [...part.sections, newSection] });
  };

  const updateSection = (index: number, updated: Section) => {
    const newSections = [...part.sections];
    newSections[index] = updated;
    onChange({ ...part, sections: newSections });
  };

  const removeSection = (index: number) => {
    const newSections = part.sections.filter((_, i) => i !== index);
    onChange({ ...part, sections: newSections });
  };

  return (
    <Card
      title={
        <Input
          placeholder="Part title"
          value={part.title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      }
      className="mb-4"
      extra={
        <Button danger onClick={onRemove} icon={<DeleteOutlined />}>
          O'chirish
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <label>🎧 Audio yuklash</label>
        <Upload
          showUploadList={false}
          accept="audio/*"
          beforeUpload={(file) => {
            handleAudioUpload(file);
            return false;
          }}
        >
          <Button
            icon={<UploadOutlined />}
            loading={fileUploadMutation.isPending}
          >
            {fileUploadMutation.isPending
              ? "Yuklanmoqda..."
              : "Audio faylni tanlang"}
          </Button>
        </Upload>

        {part.audioUrl && (
          <audio controls src={part.audioUrl} style={{ marginTop: 10 }} />
        )}

        <Button type="dashed" onClick={addSection}>
          + Add Section
        </Button>

        {part.sections.map((section, idx) => (
          <SectionForm
            key={idx}
            section={section}
            onChange={(updated) => updateSection(idx, updated)}
            onRemove={() => removeSection(idx)}
          />
        ))}
      </Space>
    </Card>
  );
};

export default PartForm;
