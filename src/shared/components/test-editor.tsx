import { useState } from "react";
import { Button, Card, Input, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCreateListeningTestWithAddition } from "@/config/queries/listening/create.queries";
import toast from "react-hot-toast";
import PartForm from "../ui/part-form";

interface Props {
  ieltsId?: string | null;
  testType?: "LISTENING" | "READING";
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

export default function TestEditor({ ieltsId, testType = "LISTENING" }: Props) {
  const [testTitle, setTestTitle] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [parts, setParts] = useState<PartDto[]>([]);

  const { mutate } = useCreateListeningTestWithAddition();

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
            content: q.text ?? "",
            answers: q.answers.map((a, aIndex) => ({
              variantText: (String.fromCharCode(65 + aIndex)), // A, B, C...
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
      },
      onError: (err: any) => {
        console.error("API Error:", err);
        const msg = err?.response?.data?.error || "Xatolik yuz berdi";
        toast.error(msg);
      },
    });
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <Card
        title="Create Listening/Reading Test"
        extra={
          <Space>
            <Button type="primary" onClick={handleSave} >
              Saqlash
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Test title"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
          />
          <Input.TextArea
            placeholder="Test description"
            value={testDescription}
            onChange={(e) => setTestDescription(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />

          {parts.map((p, idx) => (
            <PartForm
              key={idx}
              part={p}
              onChange={(updated) => updatePart(idx, updated)}
              onRemove={() => removePart(idx)}
            />
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={addPart}>
            + Add Part
          </Button>
        </Space>
      </Card>
    </div>
  );
}
