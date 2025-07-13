import React from "react";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Space,
  Select,
  Radio,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { showNotification } from "../../utils/notification";
import type {
  TestQuestionDto,
  TestAnswerDto,
} from "../../../config/querys/test-query";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface BaseQuestionFormProps {
  question: TestQuestionDto;
  onChange: (question: TestQuestionDto) => void;
  onRemove: () => void;
  testType: "LISTENING" | "READING";
}

export default function BaseQuestionForm({
  question,
  onChange,
  onRemove,
  testType,
}: BaseQuestionFormProps) {
  const updateAnswer = (index: number, updated: TestAnswerDto) => {
    const newAnswers = [...question.answers];
    newAnswers[index] = updated;
    onChange({ ...question, answers: newAnswers });
  };

  const addAnswer = () => {
    const newAnswer: TestAnswerDto = {
      variantText: String.fromCharCode(65 + question.answers.length), // A, B, C, D...
      answer: "",
      correct: false,
    };
    onChange({ ...question, answers: [...question.answers, newAnswer] });

    showNotification.success({
      message: "Yangi javob varianti qo'shildi",
      description: `${newAnswer.variantText} varianti qo'shildi`,
    });
  };

  const removeAnswer = (index: number) => {
    const answerToRemove = question.answers[index];
    const newAnswers = question.answers.filter((_, i) => i !== index);
    // Re-assign variant letters
    const reVariantedAnswers = newAnswers.map((answer, i) => ({
      ...answer,
      variantText: String.fromCharCode(65 + i),
    }));
    onChange({ ...question, answers: reVariantedAnswers });

    showNotification.warning({
      message: "Javob varianti o'chirildi",
      description: `${answerToRemove.variantText} varianti o'chirildi`,
    });
  };

  const setCorrectAnswer = (index: number) => {
    const newAnswers = question.answers.map((answer, i) => ({
      ...answer,
      correct: i === index,
    }));
    onChange({ ...question, answers: newAnswers });
  };

  const handleTypeChange = (type: string) => {
    let newAnswers = [...question.answers];

    if (type === "TRUE_FALSE" && question.answers.length === 0) {
      newAnswers = [
        { variantText: "A", answer: "TRUE", correct: false },
        { variantText: "B", answer: "FALSE", correct: false },
        { variantText: "C", answer: "NOT GIVEN", correct: false },
      ];
    }

    onChange({
      ...question,
      type: type as TestQuestionDto["type"],
      answers: newAnswers,
    });
  };

  const getQuestionIcon = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return "🔘";
      case "TRUE_FALSE":
        return "✅";
      case "FILL_IN_BLANK":
        return "📝";
      case "MATCHING":
        return "🔗";
      default:
        return "❓";
    }
  };

  const getQuestionTypeLabel = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return "Ko'p variantli";
      case "TRUE_FALSE":
        return "To'g'ri/Noto'g'ri";
      case "FILL_IN_BLANK":
        return "Bo'sh joyni to'ldirish";
      case "MATCHING":
        return "Moslashtirish";
      default:
        return "Noma'lum";
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>{getQuestionIcon()}</span>
          <Text strong style={{ fontSize: "13px" }}>
            Savol {question.number}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            ({getQuestionTypeLabel()})
          </Text>
        </div>
        <Button
          danger
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={onRemove}
        />
      </div>

      <Row gutter={[12, 12]}>
        <Col span={24}>
          <div style={{ marginBottom: "6px" }}>
            <label style={{ fontWeight: 600, fontSize: "12px" }}>
              Savol turi
            </label>
          </div>
          <Select
            value={question.type}
            onChange={handleTypeChange}
            size="small"
            style={{ width: "100%" }}
          >
            <Option value="MULTIPLE_CHOICE">🔘 Ko'p variantli</Option>
            <Option value="TRUE_FALSE">✅ To'g'ri/Noto'g'ri</Option>
            <Option value="FILL_IN_BLANK">📝 Bo'sh joyni to'ldirish</Option>
            <Option value="MATCHING">🔗 Moslashtirish</Option>
          </Select>
        </Col>

        <Col span={24}>
          <div style={{ marginBottom: "6px" }}>
            <label style={{ fontWeight: 600, fontSize: "12px" }}>
              Savol matni
            </label>
          </div>
          <TextArea
            placeholder="Savolni kiriting..."
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            rows={2}
            size="small"
          />
        </Col>

        <Col span={24}>
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label style={{ fontWeight: 600, fontSize: "12px" }}>
                Javob variantlari
              </label>
              {question.type !== "TRUE_FALSE" && (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addAnswer}
                >
                  Variant qo'shish
                </Button>
              )}
            </div>
          </div>

          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {question.answers.map((answer, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  background: answer.correct ? "#f0f9ff" : "#f9fafb",
                  borderRadius: "6px",
                  border: answer.correct
                    ? "1px solid #3b82f6"
                    : "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: answer.correct ? "#3b82f6" : "#6b7280",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {answer.variantText}
                </div>

                <Input
                  placeholder="Javob variantini kiriting..."
                  value={answer.answer}
                  onChange={(e) =>
                    updateAnswer(i, { ...answer, answer: e.target.value })
                  }
                  size="small"
                  style={{ flex: 1 }}
                  disabled={question.type === "TRUE_FALSE"}
                />

                <Radio
                  checked={answer.correct}
                  onChange={() => setCorrectAnswer(i)}
                  style={{ color: answer.correct ? "#3b82f6" : "#6b7280" }}
                />

                {question.type !== "TRUE_FALSE" && (
                  <Button
                    danger
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeAnswer(i)}
                  />
                )}
              </div>
            ))}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
