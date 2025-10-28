import React, { useState } from "react";
import { Button, Card, Input, Space, Upload, message, Collapse, Typography } from "antd";
import { DeleteOutlined, UploadOutlined, PlusOutlined } from "@ant-design/icons";
import SectionForm from "./section-form";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { PartDto, SectionDto } from "../components/test-editor";

const { Panel } = Collapse;
const { Text } = Typography;
const FILE_BASE = `${(import.meta.env.VITE_API_URL || "https://api.turkishmock.uz").replace(/\/+$/, "")}/`;

interface PartFormProps {
  part: PartDto;
  onChange: (part: PartDto) => void;
  onRemove: () => void;
  hideAudioUpload?: boolean;
}

const PartForm: React.FC<PartFormProps> = ({ part, onChange, onRemove, hideAudioUpload = false }) => {
  const fileUploadMutation = useFileUpload();
  const [activeSections, setActiveSections] = useState<number[]>([]);

  const handleAudioUpload = async (file: File) => {
    try {
      const result = await fileUploadMutation.mutateAsync(file);
      if (result?.path) {
        onChange({ ...part, audioUrl: result.path });
        message.success("Audio fayl yuklandi");
      }
    } catch (error) {
      console.error("Audio upload error:", error);
      message.error("Audio yuklashda xatolik");
    }
  };

  const updateField = (field: keyof PartDto, value: any) => {
    onChange({ ...part, [field]: value });
  };

  const addSection = () => {
    const newSection: SectionDto = {
      title: "",
      type: null,
      content: "",
      imageUrl: "",
      questions: [],
    };
    onChange({ ...part, sections: [...part.sections, newSection] });
    setActiveSections([...activeSections, part.sections.length]);
  };

  const updateSection = (index: number, updated: SectionDto) => {
    const newSections = [...part.sections];
    newSections[index] = updated;
    onChange({ ...part, sections: newSections });
  };

  const removeSection = (index: number) => {
    const newSections = part.sections.filter((_, i) => i !== index);
    onChange({ ...part, sections: newSections });
    setActiveSections(activeSections.filter((i) => i !== index));
  };

  return (
    <Card
      style={{ marginBottom: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
      title={
        <Input
          placeholder="Part title"
          value={part.title}
          onChange={(e) => updateField("title", e.target.value)}
          size="large"
        />
      }
      extra={
        <Button danger onClick={onRemove} icon={<DeleteOutlined />}>
          O'chirish
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {!hideAudioUpload && (
          <>
            <Text strong>🎧 Audio fayl yuklash</Text>
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
                style={{ width: "100%" }}
              >
                {fileUploadMutation.isPending ? "Yuklanmoqda..." : "Audio faylni tanlang"}
              </Button>
            </Upload>
            {part.audioUrl && (
              <audio
                controls
                src={FILE_BASE + part.audioUrl}
                style={{ marginTop: 10, width: "100%" }}
              />
            )}
          </>
        )}

        <Collapse
          activeKey={activeSections.map(String)}
          onChange={(keys) =>
            setActiveSections(keys.map((k) => Number(k)))
          }
          style={{ marginTop: 16 }}
        >
          {part.sections.map((section, idx) => (
            <Panel
              key={idx}
              header={section.title || `Section ${idx + 1}`}
              extra={
                <Button
                  danger
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(idx);
                  }}
                >
                  O'chirish
                </Button>
              }
            >
              <SectionForm
                section={section}
                onChange={(updated) => updateSection(idx, updated)}
                onRemove={() => removeSection(idx)}
              />
            </Panel>
          ))}
        </Collapse>

        <Button
          type="dashed"
          onClick={addSection}
          icon={<PlusOutlined />}
          block
        >
          + Add Section
        </Button>
      </Space>
    </Card>
  );
};

export default PartForm;
