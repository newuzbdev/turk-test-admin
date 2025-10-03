import { useEffect, useState } from "react";
import { Button, Card, Input, Space, Typography, Upload, Image, Progress, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { AnswerDto, QuestionDto, QuestionType } from "../components/test-editor";
import AnswerForm from "./answer-form";

const { Text } = Typography;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Props {
  question: QuestionDto;
  type: QuestionType | null;
  onChange: (q: QuestionDto) => void;
  onRemove: () => void;
}

export default function QuestionForm({
  question,
  type,
  onChange,
  onRemove,
}: Props) {
  const fileUploadMutation = useFileUpload();
  const [uploadProgress, setUploadProgress] = useState(0);
  const FILE_BASE = "https://api.turkcetest.uz/";
  useEffect(() => {
    if (!type) return;
    // default answers for TRUE_FALSE and FILL_BLANK
    if (type === "TRUE_FALSE" && question.answers.length === 0) {
      onChange({ ...question, answers: [{ text: "True", isCorrect: false }, { text: "False", isCorrect: false }] });
    } else if (type === "FILL_BLANK" && question.answers.length === 0) {
      onChange({ ...question, answers: [{ text: "", isCorrect: true }] });
    }
    // do NOT auto-fill MULTIPLE_CHOICE; answers remain empty until user clicks "Add Answer"
  }, [type]);

  const updateField = (field: keyof QuestionDto, value: any) => {
    onChange({ ...question, [field]: value });
  };

  const addAnswer = () => {
    const newAnswer: AnswerDto = { text: "", isCorrect: false };
    onChange({ ...question, answers: [...question.answers, newAnswer] });
  };

  const updateAnswer = (index: number, updated: AnswerDto) => {
    const newAnswers = [...question.answers];
    newAnswers[index] = updated;
    onChange({ ...question, answers: newAnswers });
  };

  const removeAnswer = (index: number) => {
    onChange({
      ...question,
      answers: question.answers.filter((_, i) => i !== index),
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadProgress(0);
      const result = await fileUploadMutation.mutateAsync(file);
      if (result?.path) {
        onChange({ ...question, imageUrl: result.path });
        setUploadProgress(100);
        message.success("Rasm yuklandi");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      message.error("Rasm yuklashda xatolik");
      setUploadProgress(0);
    }
  };

  return (
    <Card
      title={
        <Input
          placeholder="Question text"
          value={question.text}
          onChange={(e) => updateField("text", e.target.value)}
        />
      }
      extra={<Button danger onClick={onRemove}>Remove Question</Button>}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input
          placeholder="Question content (optional)"
          value={question.content}
          onChange={(e) => updateField("content", e.target.value)}
        />

        {/* Image Upload */}
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
            block
          >
            {fileUploadMutation.isPending ? "Yuklanmoqda..." : "Savol rasmi yuklash"}
          </Button>
        </Upload>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress percent={uploadProgress} size="small" status="active" />
        )}

        {question.imageUrl && (
          <Image
            src={FILE_BASE + question.imageUrl}
            alt="Question"
            style={{ marginTop: 10, width: "100%", maxHeight: 220, borderRadius: 8 }}
          />
        )}

        {question.answers.map((ans, idx) => (
          <div key={idx}>
            <Space style={{ width: "100%", alignItems: "center" }}>
              {type === "MULTIPLE_CHOICE" ? <Text strong>{alphabet[idx]}.</Text> : null}
              <AnswerForm
                answer={ans}
                type={type}
                index={idx}
                onChange={(u) => updateAnswer(idx, u)}
                onRemove={() => removeAnswer(idx)}
              />
            </Space>
          </div>
        ))}

        {type === "MULTIPLE_CHOICE" && (
          <Button type="dashed" onClick={addAnswer}>
            + Add Answer
          </Button>
        )}
      </Space>
    </Card>
  );
}
