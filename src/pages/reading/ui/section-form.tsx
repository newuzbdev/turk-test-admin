import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Typography,
  Tag,
  message,
} from "antd";
import { CheckOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type {
  TestAnswerDto,
  TestQuestionDto,
  TestSectionDto,
} from "../../../config/querys/test-query";
import AnswerForm from "../../../components/test/AnswerForm";
import {
  useCreateAnswer,
  useCreateQuestion,
  useDeleteAnswer,
  useDeleteQuestion,
  useUpdateSection,
  useUpdateQuestion,
  useUpdateAnswer,
} from "../../../config/querys/test-query";
import { useEffect, useState } from "react";

const { Text } = Typography;

type Props = {
  section: TestSectionDto;
  onChange: (section: TestSectionDto) => void;
  onRemove: () => void;
};

export default function SectionForm({ section, onChange, onRemove }: Props) {
  const [localSection, setLocalSection] = useState(section);

  const createQuestion = useCreateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const createAnswer = useCreateAnswer();
  const deleteAnswer = useDeleteAnswer();
  const updateSection = useUpdateSection();
  const updateQuestion = useUpdateQuestion();
  const updateAnswer = useUpdateAnswer();

  useEffect(() => {
    setLocalSection(section);
  }, [section]);

  const updateQuestionLocal = (index: number, updated: TestQuestionDto) => {
    const newQuestions = [...localSection.questions];
    newQuestions[index] = updated;
    setLocalSection({ ...localSection, questions: newQuestions });
  };

  const addQuestion = async () => {
    const newQuestion: TestQuestionDto = {
      number: localSection.questions.length + 1,
      type: "MULTIPLE_CHOICE",
      text: "",
      sectionId: localSection.id,
      answers: [],
    };

    if (localSection.id) {
      try {
        const res = await createQuestion.mutateAsync(newQuestion);
        setLocalSection({
          ...localSection,
          questions: [...localSection.questions, res],
        });
      } catch {
        message.error("Savolni yaratishda xatolik");
      }
    } else {
      setLocalSection({
        ...localSection,
        questions: [...localSection.questions, newQuestion],
      });
    }
  };

  const removeQuestion = async (index: number) => {
    const question = localSection.questions[index];

    if (question.id) {
      try {
        await deleteQuestion.mutateAsync(question.id);
      } catch {
        message.error("Savolni o‘chirishda xatolik");
        return;
      }
    }

    const newQuestions = localSection.questions.filter((_, i) => i !== index);
    setLocalSection({ ...localSection, questions: newQuestions });
  };

  const updateAnswerLocal = (
    qIndex: number,
    aIndex: number,
    updated: TestAnswerDto
  ) => {
    const newQuestions = [...localSection.questions];
    const newAnswers = [...newQuestions[qIndex].answers];
    newAnswers[aIndex] = { ...updated };
    newQuestions[qIndex] = {
      ...newQuestions[qIndex],
      answers: newAnswers,
    };
    setLocalSection({
      ...localSection,
      questions: newQuestions,
    });
  };

  const addAnswer = async (qIndex: number) => {
    const question = localSection.questions[qIndex];

    const newAnswer: TestAnswerDto = {
      answer: "Yangi javob",
      correct: false,
      variantText: "Variant",
      questionId: question.id,
    };

    if (question.id) {
      try {
        const res = await createAnswer.mutateAsync(newAnswer);
        const newQuestions = [...localSection.questions];
        newQuestions[qIndex].answers.push(res);
        setLocalSection({ ...localSection, questions: newQuestions });
      } catch {
        message.error("Javobni yaratishda xatolik");
      }
    } else {
      const updatedAnswers = [...question.answers, newAnswer];
      const newQuestions = [...localSection.questions];
      newQuestions[qIndex] = { ...question, answers: updatedAnswers };
      setLocalSection({ ...localSection, questions: newQuestions });
    }
  };

  const removeAnswer = async (qIndex: number, aIndex: number) => {
    const question = localSection.questions[qIndex];
    const answer = question.answers[aIndex];

    if (answer.id) {
      try {
        await deleteAnswer.mutateAsync(answer.id);
      } catch {
        message.error("Javobni o‘chirishda xatolik");
        return;
      }
    }

    const updatedAnswers = question.answers.filter((_, i) => i !== aIndex);
    const newQuestions = [...localSection.questions];
    newQuestions[qIndex] = { ...question, answers: updatedAnswers };
    setLocalSection({ ...localSection, questions: newQuestions });
  };

  const handleSaveSection = async () => {
    try {
      if (localSection.id) {
        await updateSection.mutateAsync({
          id: localSection.id,
          title: localSection.title,
          content: localSection.content,
          imageUrl: localSection.imageUrl,
        });

        for (let i = 0; i < localSection.questions.length; i++) {
          const q = localSection.questions[i];
          if (q.id) {
            await updateQuestion.mutateAsync({
              id: q.id,
              number: q.number,
              text: q.text,
              type: q.type,
            });

            for (let j = 0; j < q.answers.length; j++) {
              const a = q.answers[j];
              if (a.id) {
                await updateAnswer.mutateAsync({
                  id: a.id,
                  answer: a.answer,
                  correct: a.correct,
                  variantText: a.variantText,
                });
              }
            }
          }
        }
      }

      onChange(localSection);
      message.success("Bo‘lim saqlandi");
    } catch (error) {
      console.error(error);
      message.error("Bo‘limni saqlashda xatolik yuz berdi");
    }
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
            value={localSection.title}
            onChange={(e) =>
              setLocalSection({ ...localSection, title: e.target.value })
            }
            style={{ borderRadius: "6px" }}
          />
        </Col>
        <Col span={8}>
          <Input
            placeholder="Rasm URL"
            value={localSection.imageUrl}
            onChange={(e) =>
              setLocalSection({ ...localSection, imageUrl: e.target.value })
            }
            style={{ borderRadius: "6px" }}
          />
        </Col>
        <Col span={8}>
          <Input.TextArea
            placeholder="Content (matn)"
            value={localSection.content}
            onChange={(e) =>
              setLocalSection({ ...localSection, content: e.target.value })
            }
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ borderRadius: "6px" }}
          />
        </Col>
      </Row>

      <Space direction="vertical" style={{ width: "100%" }}>
        {localSection?.questions?.map((q, qIdx) => (
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
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Tag color="blue">Savol #{q.number}</Tag>
                <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                  Matnli savol
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
              placeholder="Savol matni"
              value={q.text}
              onChange={(e) =>
                updateQuestionLocal(qIdx, { ...q, text: e.target.value })
              }
              style={{ marginBottom: 12, borderRadius: "6px" }}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />

            <Text strong style={{ fontSize: "13px", color: "#374151" }}>
              Javoblar
            </Text>

            {q.answers.map((a, aIdx) => (
              <AnswerForm
                key={aIdx}
                answer={a}
                onChange={(field, value) => {
                  const updated = { ...a, [field]: value };
                  updateAnswerLocal(qIdx, aIdx, updated);
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
              Javob qo‘shish
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
          Savol qo‘shish
        </Button>
      </Space>

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Button
          type="primary"
          onClick={handleSaveSection}
          style={{ background: "#10b981", borderColor: "#10b981" }}
          icon={<CheckOutlined />}
        >
          Saqlash
        </Button>
      </div>
    </Card>
  );
}
