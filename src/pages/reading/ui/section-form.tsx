/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Card, Col, Input, Row, Space, Typography, Tag } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type {
  TestAnswerDto,
  TestQuestionDto,
  TestSectionDto,
} from "../../../config/querys/test-query";
import AnswerForm from "../../../components/test/AnswerForm";

const { Text } = Typography;

type Props = {
  section: TestSectionDto;
  onChange: (section: TestSectionDto) => void;
  onRemove: () => void;
};

export default function SectionForm({ section, onChange, onRemove }: Props) {
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
        background: "#fafafa",
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
        <Text strong style={{ color: "#374151", fontSize: "14px" }}>
          ❓ Savollar
        </Text>
      </div>

      <Space direction="vertical" style={{ width: "100%" }}>
        {section.questions.map((q, qIdx) => (
          <Card
            key={qIdx}
            size="small"
            style={{
              background: "white",
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
                <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                  Do the following statements agree with the information given
                  in Reading Passage Number?
                </Text>
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

            <div style={{ marginBottom: "12px" }}>
              <Text strong style={{ fontSize: "13px", color: "#374151" }}>
                Choice
              </Text>
            </div>

            {q.answers.map((a, aIdx) => (
              <AnswerForm
                key={aIdx}
                answer={a}
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
