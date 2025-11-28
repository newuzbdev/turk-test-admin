import React, { useState } from "react";
import { Button, Card, Input, Select, Space, Upload, message, Divider, Typography, Progress, Image } from "antd";
import { DeleteOutlined, UploadOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import QuestionForm from "./question-form";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { QuestionDto, SectionDto, AnswerDto } from "../components/test-editor";

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

  // Shared variants management for MATCHING type
  const addSharedVariant = () => {
    const newVariant: AnswerDto = { text: "", isCorrect: false };
    const sharedVariants = section.sharedVariants || [];
    onChange({ ...section, sharedVariants: [...sharedVariants, newVariant] });
  };

  const updateSharedVariant = (index: number, updated: AnswerDto) => {
    const sharedVariants = section.sharedVariants || [];
    const newVariants = [...sharedVariants];
    newVariants[index] = updated;
    onChange({ ...section, sharedVariants: newVariants });
  };

  const removeSharedVariant = (index: number) => {
    const sharedVariants = section.sharedVariants || [];
    const newVariants = sharedVariants.filter((_, i) => i !== index);
    onChange({ ...section, sharedVariants: newVariants });
    // Also update questions that reference this variant
    const updatedQuestions = section.questions.map((q) => {
      if (q.correctVariantIndex !== undefined && q.correctVariantIndex >= index) {
        if (q.correctVariantIndex === index) {
          // Remove the correct variant index if it was the removed variant
          return { ...q, correctVariantIndex: undefined };
        } else if (q.correctVariantIndex > index) {
          // Decrement the index if it was after the removed variant
          return { ...q, correctVariantIndex: q.correctVariantIndex - 1 };
        }
      }
      return q;
    });
    onChange({ ...section, sharedVariants: newVariants, questions: updatedQuestions });
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
          autoSize={{ minRows: 4, maxRows: 12 }}
          style={{ borderRadius: 8, padding: 10, resize: "vertical" }}
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
          onChange={(value) => {
            updateField("type", value);
            // Initialize shared variants for MATCHING type
            if (value === "MATCHING" && !section.sharedVariants) {
              onChange({ ...section, type: value, sharedVariants: [] });
            }
          }}
          style={{ width: "100%" }}
          options={[
            { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
            { label: "Fill in the Blank", value: "FILL_BLANK" },
            { label: "True / False", value: "TRUE_FALSE" },
            { label: "Matching", value: "MATCHING" },
            { label: "Text Input", value: "TEXT_INPUT" },
          ]}
        />

        {/* Shared Variants for MATCHING type */}
        {section.type === "MATCHING" && (
          <>
            <Divider />
            <Text strong>🔗 Umumiy variantlar (barcha savollar uchun)</Text>
            <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
              Variantlarni bir marta kiriting, keyin har bir savol uchun to'g'ri variantni tanlang
            </Text>
            {(section.sharedVariants || []).map((variant, idx) => (
              <Card
                key={idx}
                type="inner"
                size="small"
                style={{ marginBottom: 8 }}
                extra={
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => removeSharedVariant(idx)}
                  >
                    O'chirish
                  </Button>
                }
              >
                <Space style={{ width: "100%" }}>
                  <Text strong>{String.fromCharCode(65 + idx)}.</Text>
                  <Input
                    placeholder="Variant matni"
                    value={variant.text}
                    onChange={(e) =>
                      updateSharedVariant(idx, { ...variant, text: e.target.value })
                    }
                    style={{ flex: 1 }}
                  />
                </Space>
              </Card>
            ))}
            <Button
              type="dashed"
              onClick={addSharedVariant}
              icon={<PlusOutlined />}
              block
              style={{ marginBottom: 16 }}
            >
              + Variant qo'shish
            </Button>
          </>
        )}

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
              sharedVariants={section.type === "MATCHING" ? section.sharedVariants : undefined}
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
