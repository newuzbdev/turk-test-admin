import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Space,
  Badge,
  Typography,
  Upload,
  Modal,
  Select,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { showNotification } from "../../utils/notification";
import QuestionGroupComponent from "./question-group";
import QuestionSidebar from "./question-sidebar";
import type {
  TestSectionDto,
  TestQuestionDto,
} from "../../../config/querys/test-query";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BaseSectionFormProps {
  section: TestSectionDto;
  onChange: (section: TestSectionDto) => void;
  onRemove: () => void;
  testType: "LISTENING" | "READING";
  questionComponent: React.ComponentType<{
    question: TestQuestionDto;
    onChange: (question: TestQuestionDto) => void;
    onRemove: () => void;
    testType: "LISTENING" | "READING";
  }>;
}

export default function BaseSectionForm({
  section,
  onChange,
  onRemove,
  testType,
  questionComponent: QuestionComponent,
}: BaseSectionFormProps) {
  const updateQuestion = (index: number, updated: TestQuestionDto) => {
    const newQuestions = [...section.questions];
    newQuestions[index] = updated;
    onChange({ ...section, questions: newQuestions });
  };

  const addQuestion = () => {
    const newQuestion: TestQuestionDto = {
      number: section.questions.length + 1,
      type: "MULTIPLE_CHOICE",
      text: "",
      answers: [],
    };
    onChange({ ...section, questions: [...section.questions, newQuestion] });

    showNotification.success({
      message: "Yangi savol qo'shildi",
      description: `${newQuestion.number}-savol muvaffaqiyatli qo'shildi`,
    });
  };

  const removeQuestion = (index: number) => {
    const questionToRemove = section.questions[index];
    const newQuestions = section.questions.filter((_, i) => i !== index);
    // Renumber questions
    const renumberedQuestions = newQuestions.map((q, i) => ({
      ...q,
      number: i + 1,
    }));
    onChange({ ...section, questions: renumberedQuestions });

    showNotification.warning({
      message: "Savol o'chirildi",
      description: `${questionToRemove.number}-savol o'chirildi`,
    });
  };

  const getSectionIcon = () => {
    return testType === "LISTENING" ? "🎵" : "📄";
  };

  const getContentPlaceholder = () => {
    return testType === "LISTENING"
      ? "Audio uchun qo'shimcha ma'lumot yoki ko'rsatmalar..."
      : "O'qish uchun matn yoki passage...";
  };

  const getContentLabel = () => {
    return testType === "LISTENING"
      ? "📝 Qo'shimcha ma'lumot"
      : "📖 O'qish matni";
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          background:
            testType === "LISTENING"
              ? "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)"
              : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          margin: "-24px -24px 16px -24px",
          padding: "16px 24px",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>{getSectionIcon()}</span>
            <Text strong style={{ color: "#374151" }}>
              Bo'lim
            </Text>
            <Badge
              count={section.questions.length}
              style={{
                background: testType === "LISTENING" ? "#3b82f6" : "#10b981",
                color: "white",
                fontSize: "10px",
              }}
            />
          </div>
          <Button
            danger
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={onRemove}
          >
            O'chirish
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
        <Col span={24}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px" }}>
              📝 Bo'lim sarlavhasi
            </label>
          </div>
          <Input
            placeholder="Bo'lim sarlavhasini kiriting..."
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            size="large"
          />
        </Col>

        <Col span={testType === "READING" ? 18 : 24}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px" }}>
              {getContentLabel()}
            </label>
          </div>
          <TextArea
            placeholder={getContentPlaceholder()}
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
            rows={4}
          />
        </Col>

        {testType === "READING" && (
          <Col span={6}>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontWeight: 600, fontSize: "14px" }}>
                🖼️ Rasm
              </label>
            </div>
            <Upload
              maxCount={1}
              accept="image/*"
              beforeUpload={(file) => {
                onChange({ ...section, imageUrl: URL.createObjectURL(file) });
                return false;
              }}
            >
              <Button
                size="large"
                icon={<UploadOutlined />}
                style={{ width: "100%", height: "100px" }}
              >
                Rasm yuklash
              </Button>
            </Upload>
          </Col>
        )}
      </Row>

      <div
        style={{
          background: "#f9fafb",
          borderRadius: "8px",
          padding: "16px",
          border: "1px solid #f3f4f6",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <Text strong style={{ color: "#374151", fontSize: "14px" }}>
            ❓ Savollar
          </Text>
          <Badge
            count={section.questions.length}
            style={{
              background: "#f59e0b",
              color: "white",
              fontSize: "10px",
            }}
          />
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="small">
          {section.questions.map((question, i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <QuestionComponent
                question={question}
                onChange={(updated: TestQuestionDto) =>
                  updateQuestion(i, updated)
                }
                onRemove={() => removeQuestion(i)}
                testType={testType}
              />
            </div>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addQuestion}
            style={{
              width: "100%",
              height: "40px",
              borderRadius: "6px",
              background: "#fefce8",
              border: "1px dashed #f59e0b",
              color: "#d97706",
              fontWeight: 500,
              fontSize: "13px",
            }}
          >
            ➕ Yangi savol qo'shish
          </Button>
        </Space>
      </div>
    </Card>
  );
}
