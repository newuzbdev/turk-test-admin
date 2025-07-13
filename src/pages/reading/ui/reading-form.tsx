import {
  Button,
  Card,
  Input,
  Row,
  Col,
  Typography,
  Steps,
  Layout,
  Space,
  Select,
} from "antd";
import { useState } from "react";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import {
  useUpdateAnswer,
  useUpdatePart,
  useUpdateQuestion,
  useUpdateSection,
  type CreateTestDtoAudio,
  type TestPartDtoAudio,
} from "../../../config/querys/test-query";
import PartForm from "@/shared/ui/part-form";
import { useGetIeltsList } from "../../../config/querys/Ielts-query";

const { Title } = Typography;
const { Content } = Layout;

type Props = {
  onSubmit: (data: CreateTestDtoAudio) => void;
  onCancel: () => void;
  initialData?: CreateTestDtoAudio;
};

export default function ReadingForm({
  onSubmit,
  onCancel,
  initialData,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateTestDtoAudio>(
    initialData || {
      title: "",
      type: "READING",
      ieltsId: "",
      parts: [
        {
          number: 1,
          title: "",
          sections: [],
        },
      ] as TestPartDtoAudio[],
    }
  );

  const { data: ieltsList, isLoading } = useGetIeltsList();

  const updatePartMutation = useUpdatePart();
  const updateSectionMutation = useUpdateSection();
  const updateQuestionMutation = useUpdateQuestion();
  const updateAnswerMutation = useUpdateAnswer();

  const updatePart = (index: number, updated: TestPartDtoAudio) => {
    const newParts = [...formData.parts];
    newParts[index] = updated;
    setFormData({ ...formData, parts: newParts });
  };

  const addPart = () => {
    const newPart: TestPartDtoAudio = {
      number: formData.parts.length + 1,
      title: "",
      sections: [],
    };
    setFormData({ ...formData, parts: [...formData.parts, newPart] });
  };

  const removePart = (index: number) => {
    const newParts = formData.parts.filter((_, i) => i !== index);
    setFormData({ ...formData, parts: newParts });
  };
  const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

  const handleSubmit = async () => {
    if (!initialData) {
      onSubmit(formData);
      return;
    }

    const updatedParts = formData.parts;

    for (let i = 0; i < updatedParts.length; i++) {
      const updatedPart = updatedParts[i];
      const originalPart = initialData.parts[i];
      const partId = (updatedPart as any).id;

      if (!partId) continue;

      if (
        !deepEqual(
          {
            title: updatedPart.title,
            number: updatedPart.number,
          },
          {
            title: originalPart.title,
            number: originalPart.number,
          }
        )
      ) {
        await updatePartMutation.mutateAsync({
          id: partId,
          title: updatedPart.title,
          number: updatedPart.number,
        });
      }

      for (let j = 0; j < updatedPart.sections.length; j++) {
        const updatedSection = updatedPart.sections[j];
        const originalSection = originalPart.sections[j];
        const sectionId = (updatedSection as any).id;

        if (!sectionId) continue;

        // SECTION UPDATE
        if (
          !deepEqual(
            {
              title: updatedSection.title,
              content: updatedSection.content,
              imageUrl: updatedSection.imageUrl,
            },
            {
              title: originalSection.title,
              content: originalSection.content,
              imageUrl: originalSection.imageUrl,
            }
          )
        ) {
          await updateSectionMutation.mutateAsync({
            id: sectionId,
            title: updatedSection.title,
            content: updatedSection.content,
            imageUrl: updatedSection.imageUrl,
          });
        }

        for (let k = 0; k < updatedSection.questions.length; k++) {
          const updatedQuestion = updatedSection.questions[k];
          const originalQuestion = originalSection.questions[k];
          const questionId = (updatedQuestion as any).id;

          if (!questionId) continue;

          if (
            !deepEqual(
              {
                number: updatedQuestion.number,
                text: updatedQuestion.text,
                type: updatedQuestion.type,
              },
              {
                number: originalQuestion.number,
                text: originalQuestion.text,
                type: originalQuestion.type,
              }
            )
          ) {
            await updateQuestionMutation.mutateAsync({
              id: questionId,
              number: updatedQuestion.number,
              text: updatedQuestion.text,
              type: updatedQuestion.type,
            });
          }

          for (let l = 0; l < updatedQuestion.answers.length; l++) {
            const updatedAnswer = updatedQuestion.answers[l];
            const originalAnswer = originalQuestion.answers[l];
            const answerId = (updatedAnswer as any).id;

            if (!answerId) continue;

            if (
              !deepEqual(
                {
                  variantText: updatedAnswer.variantText,
                  answer: updatedAnswer.answer,
                  correct: updatedAnswer.correct,
                },
                {
                  variantText: originalAnswer.variantText,
                  answer: originalAnswer.answer,
                  correct: originalAnswer.correct,
                }
              )
            ) {
              await updateAnswerMutation.mutateAsync({
                id: answerId,
                variantText: updatedAnswer.variantText,
                answer: updatedAnswer.answer,
                correct: updatedAnswer.correct,
              });
            }
          }
        }
      }
    }

    onSubmit(formData);
  };

  const steps = [
    {
      title: "Basic info",
      status:
        currentStep > 0 ? "finish" : currentStep === 0 ? "process" : "wait",
    },
    {
      title: "Questions",
      status:
        currentStep > 1 ? "finish" : currentStep === 1 ? "process" : "wait",
    },
  ];

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <Card style={{ border: "none", boxShadow: "none" }}>
          <Title level={4}>📋 Asosiy Ma'lumotlar</Title>
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <label>Test nomi</label>
              <Input
                placeholder="Test nomini kiriting"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                size="large"
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: "8px" }}>
                <label>IELTS ID</label>
              </div>

              <Select
                placeholder="IELTS testni tanlang"
                value={formData.ieltsId}
                onChange={(value) =>
                  setFormData({ ...formData, ieltsId: value })
                }
                size="large"
                style={{ width: "100%" }}
                loading={isLoading}
              >
                {ieltsList?.data?.map(
                  (test: { id: string | number; title: string }) => (
                    <Select.Option key={test.id} value={test.id}>
                      {test.title}
                    </Select.Option>
                  )
                )}
              </Select>
            </Col>
          </Row>
        </Card>
      );
    }

    return (
      <div>
        <Title level={4}>❓ Savollar</Title>
        {formData.parts?.map((part, i) => (
          <PartForm
            key={i}
            part={part}
            onChange={(updated) => updatePart(i, updated)}
            onRemove={() => removePart(i)}
          />
        ))}
        <Button
          type="dashed"
          onClick={addPart}
          style={{
            width: "100%",
            marginTop: 16,
            height: "48px",
            borderRadius: "8px",
            borderStyle: "dashed",
            borderColor: "#10b981",
          }}
        >
          ➕ Yangi Part Qo‘shish
        </Button>
      </div>
    );
  };

  return (
    <Layout style={{ background: "transparent", minHeight: "80vh" }}>
      <div style={{ padding: "16px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (currentStep > 0) setCurrentStep(currentStep - 1);
              else onCancel();
            }}
          >
            {currentStep > 0 ? "Oldingi qadam" : "Orqaga"}
          </Button>

          <Steps
            current={currentStep}
            size="small"
            style={{ flex: 1, margin: "0 40px" }}
          >
            {steps.map((step, index) => (
              <Steps.Step
                key={index}
                title={step.title}
                status={step.status as any}
              />
            ))}
          </Steps>

          <Space>
            {currentStep > 0 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Orqaga
              </Button>
            )}
            {currentStep < 1 ? (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                disabled={!formData.title || !formData.ieltsId}
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                Keyingi
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleSubmit}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                Saqlash
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Layout>
        <Content style={{ padding: "24px", background: "transparent" }}>
          {renderStepContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
