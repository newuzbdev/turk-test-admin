import React, { useState } from "react";
import { Button, Card, Input, Select, Space, Upload, message, Divider, Typography, Progress, Image } from "antd";
import { DeleteOutlined, UploadOutlined, PlusOutlined } from "@ant-design/icons";
import QuestionForm from "./question-form";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { QuestionDto, SectionDto } from "../components/test-editor";

const { Text } = Typography;
const FILE_BASE = `${(import.meta.env.VITE_API_URL || "https://api.turkishmock.uz").replace(/\/+$/, "")}/`;

interface SectionFormProps {
  section: SectionDto;
  onChange: (section: SectionDto) => void;
  onRemove: () => void;
}

const SectionForm: React.FC<SectionFormProps> = ({ section, onChange, onRemove }) => {
  const fileUploadMutation = useFileUpload();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (file: File) => {
    try {
      setUploadProgress(0);
      const result = await fileUploadMutation.mutateAsync(file);
      console.log("Image upload result:", result);
      const imageUrl = (result as any)?.data?.url || (result as any)?.path;
      if (imageUrl) {
        onChange({ ...section, imageUrl: imageUrl });
        console.log("Set section imageUrl to:", imageUrl);
        setUploadProgress(100);
        message.success("Rasm yuklandi");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      message.error("Rasm yuklashda xatolik");
      setUploadProgress(0);
    }
  };

  const updateField = (field: keyof SectionDto, value: any) => {
    onChange({ ...section, [field]: value });
  };

  const addQuestion = () => {
    const newQuestion: QuestionDto = {
      text: "",
      content: "",
      answers: [],
    };
    onChange({ ...section, questions: [...section.questions, newQuestion] });
  };

  const updateQuestion = (index: number, updated: QuestionDto) => {
    const newQuestions = [...section.questions];
    newQuestions[index] = updated;
    onChange({ ...section, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = section.questions.filter((_, i) => i !== index);
    onChange({ ...section, questions: newQuestions });
  };

  return (
    <Card
      style={{ marginBottom: 24, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}
      bodyStyle={{ padding: 24 }}
      title={
        <Input
          placeholder="Section title"
          value={section.title}
          onChange={(e) => updateField("title", e.target.value)}
          size="large"
          style={{ fontWeight: "bold", fontSize: 18 }}
        />
      }
      extra={
        <Button danger onClick={onRemove} icon={<DeleteOutlined />}>
          O'chirish
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Text strong>📄 Content</Text>
        <Input.TextArea
          rows={4}
          placeholder="Matn kiriting..."
          value={section.content}
          onChange={(e) => updateField("content", e.target.value)}
          style={{ borderRadius: 8, padding: 10 }}
        />

        <Divider />

        {/* Image Upload */}
        <Text strong>🖼️ Rasm yuklash</Text>
        <Upload
          showUploadList={false}
          accept="image/*"
          beforeUpload={(file) => {
            handleImageUpload(file);
            return false;
          }}
        >
          <Button
            icon={<UploadOutlined />}
            loading={fileUploadMutation.isPending}
            size="large"
            block
          >
            {fileUploadMutation.isPending ? "Yuklanmoqda..." : "Rasm faylni tanlang"}
          </Button>
        </Upload>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress percent={uploadProgress} size="small" status="active" />
        )}

        {section.imageUrl && (
          <div>
            <Image
              src={section.imageUrl.startsWith("http") ? section.imageUrl : FILE_BASE + section.imageUrl}
              alt="Section"
              className="!w-full"
              style={{ marginTop: 10, width: "100%", maxHeight: 220, borderRadius: 8 }}
              onError={(e) => {
                console.error("Image load error:", e);
                console.log("Failed to load image URL:", section.imageUrl ? section.imageUrl.startsWith("http") ? section.imageUrl : FILE_BASE + section.imageUrl : "");
              }}
            />
            
          </div>
        )}

        <Divider />

        {/* Question Type */}
        <Text strong>📝 Savol turi</Text>
        <Select
          placeholder="Savol turi"
          value={section.type}
          onChange={(value) => updateField("type", value)}
          style={{ width: "100%" }}
          options={[
            { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
            { label: "Fill in the Blank", value: "FILL_BLANK" },
            { label: "True / False", value: "TRUE_FALSE" },
            { label: "Matching", value: "MATCHING" },
            { label: "Text Input", value: "TEXT_INPUT" },
          ]}
        />

        <Button
          type="dashed"
          onClick={addQuestion}
          disabled={!section.type}
          icon={<PlusOutlined />}
          block
        >
          + Add Question
        </Button>

        {/* Questions */}
        {section.questions.map((q, idx) => (
          <Card
            key={idx}
            type="inner"
            style={{ marginTop: 16, borderRadius: 8 }}
            title={`Question ${idx + 1}`}
            extra={
              <Button
                danger
                size="small"
                onClick={() => removeQuestion(idx)}
              >
                O'chirish
              </Button>
            }
          >
            <QuestionForm
              question={q}
              type={section.type}
              onChange={(updated) => updateQuestion(idx, updated)}
              onRemove={() => removeQuestion(idx)}
            />
          </Card>
        ))}
      </Space>
    </Card>
  );
};

export default SectionForm;
