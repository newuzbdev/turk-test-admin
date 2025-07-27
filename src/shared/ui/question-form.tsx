/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input, Button, Select, Card, Space, Tag, Divider,  } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useContext } from "react";

import AnswerForm from "./answer-form";
import type {
  TestAnswerDto,
  TestQuestionDto,
} from "@/config/queries/ielts/get-all.queries";
import { QuestionType } from "@/utils/types/types";
import { ThemeContext } from "@/providers/theme-provider";

type Props = {
  question: TestQuestionDto;
  onChange: (q: TestQuestionDto) => void;
  onRemove: () => void;
};

export default function QuestionForm({ question, onChange, onRemove }: Props) {
  const { theme: mode } = useContext(ThemeContext);
  const isDark = mode === "dark";

  const updateAnswer = (
    index: number,
    field: keyof TestAnswerDto,
    value: any
  ) => {
    const newAnswers = [...question.answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    onChange({ ...question, answers: newAnswers });
  };

  const addAnswer = () => {
    onChange({
      ...question,
      answers: [
        ...question.answers,
        { variantText: "", answer: "", correct: false },
      ],
    });
  };

  const removeAnswer = (index: number) => {
    const newAnswers = question.answers.filter((_, i) => i !== index);
    onChange({ ...question, answers: newAnswers });
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case QuestionType.TEXT_INPUT:
        return "Matn kiritish";
      case QuestionType.MULTIPLE_CHOICE:
        return "Ko'p tanlovli";
      case QuestionType.MULTI_SELECT:
        return "Ko'p tanlash";
      case QuestionType.MATCHING:
        return "Moslashtirish";
      case QuestionType.TRUE_FALSE:
        return "To'g'ri/Noto'g'ri";
      case QuestionType.FILL_BLANK:
        return "Bo'sh joyni to'ldirish";
      default:
        return type;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case QuestionType.TEXT_INPUT:
        return "#8b5cf6";
      case QuestionType.MULTIPLE_CHOICE:
        return "#3b82f6";
      case QuestionType.MULTI_SELECT:
        return "#06b6d4";
      case QuestionType.MATCHING:
        return "#f59e0b";
      case QuestionType.TRUE_FALSE:
        return "#ef4444";
      case QuestionType.FILL_BLANK:
        return "#10b981";
      default:
        return isDark ? "#9CA3AF" : "#6b7280";
    }
  };

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        background: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Tag
            color="blue"
            style={{
              borderRadius: "6px",
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            Savol #{question.number}
          </Tag>
          <Tag
            style={{
              background: getQuestionTypeColor(question.type),
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 500,
            }}
          >
            {getQuestionTypeLabel(question.type)}
          </Tag>
        </div>
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          style={{
            color: "#ef4444",
            borderRadius: "6px",
            padding: "4px 8px",
          }}
        >
          O'chirish
        </Button>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ marginBottom: "8px" }}>
          <label
            style={{
              fontWeight: 500,
              color: isDark ? "#E5E7EB" : "#374151",
              fontSize: "14px"
            }}
          >
            Savol matni
          </label>
        </div>
        <Input.TextArea
          placeholder="Savolni kiriting..."
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          style={{
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "8px" }}>
          <label
            style={{
              fontWeight: 500,
              color: isDark ? "#E5E7EB" : "#374151",
              fontSize: "14px"
            }}
          >
            Savol turi
          </label>
        </div>
        <Select
          value={question.type}
          onChange={(value) => onChange({ ...question, type: value })}
          style={{ width: "100%", maxWidth: "300px" }}
          size="large"
          placeholder="Savol turini tanlang"
          options={[
            { label: "Matn kiritish", value: QuestionType.TEXT_INPUT },
            { label: "Ko'p tanlovli", value: QuestionType.MULTIPLE_CHOICE },
            { label: "Ko'p tanlash", value: QuestionType.MULTI_SELECT },
            { label: "Moslashtirish", value: QuestionType.MATCHING },
            { label: "To'g'ri/Noto'g'ri", value: QuestionType.TRUE_FALSE },
            { label: "Bo'sh joyni to'ldirish", value: QuestionType.FILL_BLANK },
          ]}
        />
      </div>

      <Divider
        orientation="left"
        style={{
          color: isDark ? "#D1D5DB" : "#6b7280",
          fontSize: "14px",
          fontWeight: 500,
          margin: "20px 0 16px 0",
        }}
      >
        💡 Javob variantlari
      </Divider>

      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {question.answers.map((a, i) => (
          <AnswerForm
            key={i}
            answer={a}
            questionType={question.type}
            answerIndex={i}
            onChange={(field, value) => updateAnswer(i, field, value)}
            onRemove={() => removeAnswer(i)}
          />
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addAnswer}
          style={{
            width: "100%",
            height: "44px",
            borderRadius: "8px",
            borderColor: "#10b981",
            color: "#10b981",
            fontSize: "14px",
            fontWeight: 500,
            background: "#f0fdf4",
            marginTop: "8px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#dcfce7";
            e.currentTarget.style.borderColor = "#059669";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f0fdf4";
            e.currentTarget.style.borderColor = "#10b981";
          }}
        >
          Javob variantini qo'shish
        </Button>
      </Space>
    </Card>
  );
}
