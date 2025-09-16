import { Button, Card, Divider, Input, Space } from "antd";

import PartForm from "../ui/part-form";
import { PlusOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Props {
  ieltsId?: string | null;
  testType?: "LISTENING" | "READING";
  backUrl: string;
  useCreateTestWithAddition: any;
}
// types for test editor
export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TEXT_INPUT"
  | "TRUE_FALSE"
  | "MATCHING"
  | "FILL_BLANK";

export interface AnswerDto {
  text: string; // user-entered answer text
  isCorrect: boolean;
}

export interface QuestionDto {
  text: string;
  content?: string;
  answers: AnswerDto[];
}

export interface SectionDto {
  title: string;
  content?: string;
  imageUrl?: string;
  type: QuestionType | null;
  questions: QuestionDto[];
}

export interface PartDto {
  title: string;
  description?: string;
  audioUrl?: string;
  sections: SectionDto[];
}

export interface TestDto {
  title: string;
  description?: string;
  type?: "LISTENING" | "READING";
  ieltsId?: string;
  parts: PartDto[];
}

export default function TestEditor({
  ieltsId,
  testType,
  backUrl,
  useCreateTestWithAddition,
}: Props) {
  const [testTitle, setTestTitle] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [parts, setParts] = useState<PartDto[]>([]);
  const navigate = useNavigate();
  const { mutate } = useCreateTestWithAddition();

  const addPart = () => {
    setParts([
      ...parts,
      {
        title: "",
        description: "",
        audioUrl: "",
        sections: [],
      },
    ]);
  };

  const updatePart = (index: number, updated: PartDto) => {
    const newParts = [...parts];
    newParts[index] = updated;
    setParts(newParts);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  // Build payload according to API doc
  const buildPayload = (): any => {
    return {
      title: testTitle,
      description: testDescription,
      type: testType,
      ieltsId: ieltsId ?? undefined,
      parts: parts.map((p, pIndex) => ({
        number: pIndex + 1,
        title: p.title,
        description: p.description ?? "",
        audioUrl: p.audioUrl ?? "",
        sections: p.sections.map((s) => ({
          title: s.title,
          content: s.content ?? s.title ?? "",
          imageUrl: s.imageUrl ?? "",
          questions: s.questions.map((q, qIndex) => ({
            number: qIndex + 1,
            type: s.type ?? "TEXT_INPUT",
            text: q.text ?? "",
            content: q.content ?? "",
            answers: q.answers.map((a, aIndex) => ({
              variantText: String.fromCharCode(65 + aIndex), // A, B, C...
              answer: String(a.text ?? ""),
              correct: Boolean(a.isCorrect),
            })),
          })),
        })),
      })),
    } as any; // cast to any to match API shape; TS types above kept for dev
  };

  const handleSave = () => {
    if (!testTitle.trim()) {
      toast.error("Test sarlavhasi bo'sh bo'lmasligi kerak");
      return;
    }
    if (!ieltsId) {
      toast.error("IELTS ID topilmadi. Testni tegishli IELTS ga bog'lang.");
      return;
    }

    const payload = buildPayload();
    mutate(payload, {
      onSuccess: () => {
        toast.success("Test muvaffaqiyatli yaratildi");
        // clear
        setTestTitle("");
        setTestDescription("");
        setParts([]);
        navigate(backUrl);
      },
      onError: (err: any) => {
        console.error("API Error:", err);
        const msg = err?.response?.data?.error || "Xatolik yuz berdi";
        toast.error(msg);
      },
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
        {testType === "LISTENING"
          ? "Listening Test Editor"
          : "Reading Test Editor"}
      </Title>
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Input
            placeholder="Test title"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            size="large"
          />
          <Input.TextArea
            placeholder="Test description"
            value={testDescription}
            onChange={(e) => setTestDescription(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            size="large"
          />
          <Divider style={{ margin: "16px 0" }} />

          {parts.map((p, idx) => (
            <PartForm
              key={idx}
              part={p}
              onChange={(updated) => updatePart(idx, updated)}
              onRemove={() => removePart(idx)}
            />
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={addPart} block>
            Add New Part
          </Button>
        </Space>
      </Card>
      <Button type="primary" size="large" onClick={handleSave} block>
        Save Test
      </Button>
    </div>
  );
}
