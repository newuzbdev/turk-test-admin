import React from "react";
import { Button, Card, Input, Select, Space, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import QuestionForm from "./question-form";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { QuestionDto, SectionDto } from "../components/test-editor";

interface SectionFormProps {
  section: SectionDto;
  onChange: (section: SectionDto) => void;
  onRemove: () => void;
}

const SectionForm: React.FC<SectionFormProps> = ({
  section,
  onChange,
  onRemove,
}) => {
  const fileUploadMutation = useFileUpload();

  const handleImageUpload = async (file: File) => {
    try {
      const result = await fileUploadMutation.mutateAsync(file);
      if (result?.path) {
        onChange({ ...section, imageUrl: result.path });
      }
    } catch (error) {
      console.error("Image upload error:", error);
      message.error("Rasm yuklashda xatolik");
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
      title={
        <Input
          placeholder="Section title"
          value={section.title}
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
        <label>📄 Content</label>
        <Input.TextArea
          rows={3}
          placeholder="Matn kiriting..."
          value={section.content}
          onChange={(e) => updateField("content", e.target.value)}
        />

        <label>🖼️ Rasm yuklash</label>
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
          >
            {fileUploadMutation.isPending
              ? "Yuklanmoqda..."
              : "Rasm faylni tanlang"}
          </Button>
        </Upload>

        {section.imageUrl && (
          <img
            src={section.imageUrl}
            alt="Section"
            style={{ marginTop: 10, maxHeight: 200 }}
          />
        )}

        <Select
          placeholder="Savol turi"
          value={section.type}
          onChange={(value) => updateField("type", value)}
          style={{ width: 250 }}
          options={[
            { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
            { label: "Fill in the Blank", value: "FILL_BLANK" },
            { label: "True / False", value: "TRUE_FALSE" },
            { label: "Matching", value: "MATCHING" },
            { label: "Text Input", value: "TEXT_INPUT" },
          ]}
        />

        <Button type="dashed" onClick={addQuestion} disabled={!section.type}>
          + Add Question
        </Button>

        {section.questions.map((q, idx) => (
          <QuestionForm
            key={idx}
            question={q}
            type={section.type}
            onChange={(updated) => updateQuestion(idx, updated)}
            onRemove={() => removeQuestion(idx)}
          />
        ))}
      </Space>
    </Card>
  );
};

export default SectionForm;
