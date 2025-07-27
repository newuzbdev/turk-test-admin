/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input, Button, Col, Row, Tag, } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useContext } from "react";
import type { TestAnswerDto } from "@/config/queries/ielts/get-all.queries";
import { QuestionType } from "@/utils/types/types";
import { ThemeContext } from "@/providers/theme-provider";

type Props = {
  answer: TestAnswerDto;
  onChange: (field: keyof TestAnswerDto, value: any) => void;
  onRemove: () => void;
  questionType?: string;
  answerIndex?: number;
};

export default function AnswerForm({
  answer,
  onChange,
  onRemove,
  questionType,
  answerIndex = 0,
}: Props) {
  const { theme: mode } = useContext(ThemeContext);
  const isDark = mode === "dark";

  const handleCorrectToggle = () => {
    onChange("correct", !answer.correct);
  };

  const getVariantPlaceholder = () => {
    if (!questionType) return "Variant";

    switch (questionType) {
      case QuestionType.TRUE_FALSE:
        if (answerIndex === 0) return "True";
        if (answerIndex === 1) return "False";
        if (answerIndex === 2) return "Not Given";
        return "Variant";
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.MULTI_SELECT:
        return String.fromCharCode(65 + answerIndex); // A, B, C, D...
      case QuestionType.MATCHING:
        return `${answerIndex + 1}`; // 1, 2, 3, 4...
      case QuestionType.TEXT_INPUT:
      case QuestionType.FILL_BLANK:
        return "Text";
      default:
        return "Variant";
    }
  };

  const getSuggestedVariantText = () => {
    if (!questionType) return answer.variantText;

    switch (questionType) {
      case QuestionType.TRUE_FALSE:
        if (answerIndex === 0) return "True";
        if (answerIndex === 1) return "False";
        if (answerIndex === 2) return "Not Given";
        return "";
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.MULTI_SELECT:
        return String.fromCharCode(65 + answerIndex); // A, B, C, D...
      case QuestionType.MATCHING:
        return `${answerIndex + 1}`; // 1, 2, 3, 4...
      default:
        return answer.variantText;
    }
  };

  return (
    <Row gutter={8} style={{ marginBottom: 8, alignItems: "center" }}>
      <Col span={3}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: answer.variantText
              ? "#3b82f6"
              : isDark ? "#4B5563" : "#e5e7eb",
            color: answer.variantText
              ? "white"
              : isDark ? "#9CA3AF" : "#6B7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {answer.variantText || "?"}
        </div>
      </Col>
      <Col span={2}>
        <Input
          placeholder={getVariantPlaceholder()}
          value={getSuggestedVariantText()}
          onChange={(e) => onChange("variantText", e.target.value)}
          style={{
            textAlign: "center",
            borderRadius: "6px",
            fontWeight: "bold",
          }}
          maxLength={10}
        />
      </Col>
      <Col span={14}>
        <Input
          placeholder="Javob matni"
          value={answer.answer}
          onChange={(e) => onChange("answer", e.target.value)}
          style={{ borderRadius: "6px" }}
        />
      </Col>
      <Col span={3}>
        <Tag
          color={answer.correct ? "green" : "default"}
          style={{
            cursor: "pointer",
            borderRadius: "4px",
            border: "none",
            padding: "4px 8px",
          }}
          onClick={handleCorrectToggle}
        >
          {answer.correct ? "✅ To'g'ri" : "Noto'g'ri"}
        </Tag>
      </Col>
      <Col span={2}>
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          size="small"
        />
      </Col>
    </Row>
  );
}
