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
  message,
} from "antd";
import { useState } from "react";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type {
  CreateTestDto,
  TestPartDto,
} from "../../../config/querys/test-query";
import PartForm from "../../../components/test/part-form";
import { useGetIeltsList } from "../../../config/querys/Ielts-query";
import {
  useUpdatePart,
  useUpdateSection,
  useUpdateQuestion,
  useUpdateAnswer,
  useCreatePart,
  useDeletePart,
  useCreateTest,
  useUpdateTest,
} from "../../../config/querys/test-query";

const { Title } = Typography;
const { Content } = Layout;

type Props = {
  onSubmit: (data: CreateTestDto) => void;
  onCancel: () => void;
  initialData?: CreateTestDto;
};

export default function ListeningForm({
  onSubmit,
  onCancel,
  initialData,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateTestDto>(
    initialData || {
      title: "",
      type: "LISTENING",
      ieltsId: "",
      parts: [
        {
          number: 1,
          title: "",
          audioUrl: "",
          sections: [],
        },
      ],
    }
  );

  const { data, isLoading } = useGetIeltsList();
  const updatePart = useUpdatePart();
  const updateSection = useUpdateSection();
  const updateQuestion = useUpdateQuestion();
  const updateAnswer = useUpdateAnswer();
  const createPart = useCreatePart();
  const deletePart = useDeletePart();
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();

  const steps = [
    { title: "Basic info", status: currentStep === 0 ? "process" : "finish" },
    { title: "Questions", status: currentStep === 1 ? "process" : "wait" },
  ];

  const updatePartData = (index: number, updated: TestPartDto) => {
    const newParts = [...formData.parts];
    newParts[index] = updated;
    setFormData({ ...formData, parts: newParts });
  };

  const addPart = async () => {
    const isCreated = !!formData.id;
    const newPart = {
      number: formData.parts.length + 1,
      title: "",
      audioUrl: "",
      sections: [],
    };

    if (!isCreated) {
      setFormData((prev) => ({
        ...prev,
        parts: [...prev.parts, newPart],
      }));
      return;
    }

    try {
      const created = await createPart.mutateAsync({
        ...newPart,
        testId: formData.id,
      });

      setFormData((prev) => ({
        ...prev,
        parts: [...prev.parts, { ...newPart, id: created.id }],
      }));

      message.success("✅ Yangi Part yaratildi");
    } catch (error: any) {
      console.error("Xatolik: ", error?.response?.data || error);
      message.error("❌ Part yaratishda xatolik");
    }
  };

  const removePart = async (part: TestPartDto, index: number) => {
    if (part.id) {
      try {
        await deletePart.mutateAsync(part.id);
        message.success("Part o‘chirildi");
      } catch {
        message.error("Partni o‘chirishda xatolik yuz berdi");
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      if (!initialData) {
        const created = await createTest.mutateAsync({
          title: formData.title,
          type: formData.type,
          ieltsId: formData.ieltsId,
          parts: [],
        });

        const createdForm: CreateTestDto = {
          ...formData,
          id: created.id,
        };

        message.success("✅ Test yaratildi");
        onSubmit(createdForm);
        return;
      }

      await updateTest.mutateAsync({
        id: formData.id,
        title: formData.title,
        type: formData.type,
        ieltsId: formData.ieltsId,
        parts: [],
      });

      for (const part of formData.parts) {
        if (part.id) {
          await updatePart.mutateAsync({
            id: part.id,
            title: part.title,
            number: part.number,
            audioUrl: part.audioUrl,
          });
        }

        for (const section of part.sections) {
          if (section.id) {
            await updateSection.mutateAsync({
              id: section.id,
              title: section.title,
              content: section.content,
              imageUrl: section.imageUrl,
            });
          }

          for (const question of section.questions) {
            if (question.id) {
              await updateQuestion.mutateAsync({
                id: question.id,
                number: question.number,
                text: question.text,
                type: question.type,
              });
            }

            for (const answer of question.answers) {
              if (answer.id) {
                await updateAnswer.mutateAsync({
                  id: answer.id,
                  variantText: answer.variantText,
                  answer: answer.answer,
                  correct: answer.correct,
                });
              }
            }
          }
        }
      }

      message.success("✅ Test yangilandi");
      onSubmit(formData);
    } catch (error: any) {
      console.error(error);
      message.error("❌ Saqlashda xatolik yuz berdi");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <Title level={4}>📋 Asosiy Ma'lumotlar</Title>
            <Row gutter={24}>
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
                <label>IELTS ID</label>
                <Select
                  placeholder="IELTS testni tanlang"
                  value={formData.ieltsId}
                  onChange={(value) =>
                    setFormData({ ...formData, ieltsId: value })
                  }
                  size="large"
                  loading={isLoading}
                  style={{ width: "100%" }}
                >
                  {data?.data?.map((test: any) => (
                    <Select.Option key={test.id} value={test.id}>
                      {test.title}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>
        );
      case 1:
        return (
          <div>
            <Title level={4}>❓ Savollar</Title>
            {formData.parts.map((part, i) => (
              <PartForm
                key={i}
                part={part}
                onChange={(updated) => updatePartData(i, updated)}
                onRemove={() => removePart(part, i)}
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
                borderColor: "#10b981",
              }}
            >
              ➕ Yangi Part Qo‘shish
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ background: "transparent" }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              currentStep > 0 ? setCurrentStep(currentStep - 1) : onCancel()
            }
          >
            {currentStep > 0 ? "Oldingi qadam" : "Orqaga"}
          </Button>

          <Steps
            current={currentStep}
            size="small"
            style={{ flex: 1, maxWidth: 600 }}
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
            {currentStep < 1 ? (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!formData.title || !formData.ieltsId}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                Keyingi
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleSave}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                Saqlash
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Content style={{ padding: 24 }}>{renderStepContent()}</Content>
    </Layout>
  );
}
