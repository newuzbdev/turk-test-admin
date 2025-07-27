/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Typography,
  Tag,
  Select,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useContext } from "react";

import AnswerForm from "./answer-form";
import type {
  TestAnswerDto,
  TestQuestionDto,
  TestSectionDto,
} from "@/config/queries/ielts/get-all.queries";
import { QuestionType } from "@/utils/types/types";
import { ThemeContext } from "@/providers/theme-provider";

const { Text } = Typography;

type Props = {
  section: TestSectionDto;
  onChange: (section: TestSectionDto) => void;
  onRemove: () => void;
};

export default function SectionForm({ section, onChange, onRemove }: Props) {
  const { theme: mode } = useContext(ThemeContext);
  const isDark = mode === "dark";

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
        return type || "Tanlang";
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

  const updateQuestion = (index: number, updated: TestQuestionDto) => {
    const newQuestions = [...section.questions];
    newQuestions[index] = updated;
    onChange({ ...section, questions: newQuestions });
  };

  const addQuestion = () => {
    const newQuestion: TestQuestionDto = {
      number: section.questions.length + 1,
      type: "",
      text: "",
      answers: [],
    };
    onChange({ ...section, questions: [...section.questions, newQuestion] });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = section.questions.filter(
      (_: any, i: number) => i !== index
    );
    onChange({ ...section, questions: newQuestions });
  };

  const updateAnswer = (
    qIndex: number,
    aIndex: number,
    updated: TestAnswerDto
  ) => {
    const questions = [...section.questions];
    const answers = [...questions[qIndex].answers];
    answers[aIndex] = updated;
    questions[qIndex].answers = answers;
    onChange({ ...section, questions });
  };

  const addAnswer = (qIndex: number) => {
    const questions = [...section.questions];
    questions[qIndex].answers.push({
      answer: "",
      correct: false,
      variantText: "",
    });
    onChange({ ...section, questions });
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const questions = [...section.questions];
    questions[qIndex].answers = questions[qIndex].answers.filter(
      (_: any, i: number) => i !== aIndex
    );
    onChange({ ...section, questions });
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: "8px",
        border: "1px solid #f0f0f0",
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
        <Text strong style={{ color: "#1f2937" }}>
          📖 Bo'lim
        </Text>
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          size="small"
        >
          O'chirish
        </Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: "16px" }}>
        <Col span={8}>
          <Input
            placeholder="Sarlavha"
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            style={{ borderRadius: "6px" }}
          />
        </Col>
        <Col span={8}>
          <Input
            placeholder="Rasm URL"
            value={section.imageUrl}
            onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
            style={{ borderRadius: "6px" }}
          />
        </Col>
        <Col span={8}>
          <Input.TextArea
            placeholder="Content (matn)"
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ borderRadius: "6px" }}
          />
        </Col>
      </Row>

      <div style={{ marginBottom: "12px" }}>
        <Text strong style={{
          color: isDark ? "#E5E7EB" : "#374151",
          fontSize: "14px"
        }}>
          ❓ Savollar
        </Text>
      </div>

      <Space direction="vertical" style={{ width: "100%" }}>
        {section.questions.map((q, qIdx) => (
          <Card
            key={qIdx}
            size="small"
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Tag color="blue">Savol #{q.number}</Tag>
                {q.type && (
                  <Tag
                    style={{
                      background: getQuestionTypeColor(q.type),
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    {getQuestionTypeLabel(q.type)}
                  </Tag>
                )}
              </div>
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => removeQuestion(qIdx)}
                size="small"
              />
            </div>

            <Input.TextArea
              placeholder="Let's ask a question"
              value={q.text}
              onChange={(e) =>
                updateQuestion(qIdx, { ...q, text: e.target.value })
              }
              style={{ marginBottom: 12, borderRadius: "6px" }}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />

            <div style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "8px" }}>
                <Text strong style={{
                  fontSize: "13px",
                  color: isDark ? "#E5E7EB" : "#374151"
                }}>
                  Savol turi
                </Text>
              </div>
              <Select
                value={q.type}
                onChange={(value) =>
                  updateQuestion(qIdx, { ...q, type: value })
                }
                style={{ width: "100%", maxWidth: "300px" }}
                size="middle"
                placeholder="Savol turini tanlang"
                options={[
                  { label: "Matn kiritish", value: QuestionType.TEXT_INPUT },
                  {
                    label: "Ko'p tanlovli",
                    value: QuestionType.MULTIPLE_CHOICE,
                  },
                  { label: "Ko'p tanlash", value: QuestionType.MULTI_SELECT },
                  { label: "Moslashtirish", value: QuestionType.MATCHING },
                  {
                    label: "To'g'ri/Noto'g'ri",
                    value: QuestionType.TRUE_FALSE,
                  },
                  {
                    label: "Bo'sh joyni to'ldirish",
                    value: QuestionType.FILL_BLANK,
                  },
                ]}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <Text strong style={{
                fontSize: "13px",
                color: isDark ? "#E5E7EB" : "#374151"
              }}>
                Choice
              </Text>
            </div>

            {q.answers.map((a, aIdx) => (
              <AnswerForm
                key={aIdx}
                answer={a}
                questionType={q.type}
                answerIndex={aIdx}
                onChange={(field, value) => {
                  const updated = { ...a, [field]: value };
                  updateAnswer(qIdx, aIdx, updated);
                }}
                onRemove={() => removeAnswer(qIdx, aIdx)}
              />
            ))}

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => addAnswer(qIdx)}
              block
              style={{
                marginTop: "8px",
                borderRadius: "6px",
                borderColor: "#d1d5db",
              }}
            >
              Javob qo'shish
            </Button>
          </Card>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addQuestion}
          block
          style={{
            borderRadius: "6px",
            borderColor: "#10b981",
            color: "#10b981",
          }}
        >
          Savol qo'shish
        </Button>
      </Space>
    </Card>
  );
}
