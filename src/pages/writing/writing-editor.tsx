import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  Row,
  Col,
  Space,
  Form,
  notification,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useGetOneWritingTest } from "@/config/queries/writing/get-one.queries";
import { useCreateWritingTestWithAddition } from "@/config/queries/writing/create.queries";
import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";
import type { WritingSection, WritingSubPart } from "@/utils/types/types";

const { TextArea } = Input;

interface WritingTestData {
  title: string;
  instruction: string;
  type: string;
  ieltsId: string;
  sections: WritingSection[];
}

export default function WritingEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  const [testData, setTestData] = useState<WritingTestData>({
    title: "",
    instruction: "",
    type: "academic",
    ieltsId: "",
    sections: [],
  });

  // Check if this is a new test creation
  const isNewTest = id?.startsWith("temp-") || location.state?.isNew;
  const initialTestData = location.state?.testData;

  const { mutateAsync: createTest, isPending: isCreating } =
    useCreateWritingTestWithAddition();
  const { data: test, isLoading } = useGetOneWritingTest(
    isNewTest ? "" : id || ""
  );
  const { data: ieltsData, isLoading: isIeltsLoading } = useGetAllIelts();

  // Initialize test data from location state or API
  useEffect(() => {
    if (isNewTest && initialTestData) {
      setTestData((prev) => ({
        ...prev,
        title: initialTestData.title || "",
        type: initialTestData.type || "academic",
        ieltsId: initialTestData.ieltsId || "",
        instruction: "You have 60 minutes to complete both tasks.",
      }));
      form.setFieldsValue({
        title: initialTestData.title || "",
        type: initialTestData.type || "academic",
        ieltsId: initialTestData.ieltsId || "",
        instruction: "You have 60 minutes to complete both tasks.",
      });
    } else if (test?.data && !isNewTest) {
      const testInfo = test.data;
      setTestData({
        title: testInfo.title || "",
        instruction: testInfo.instruction || "",
        type: (testInfo as any).type || "academic", // WritingTest type doesn't have type field yet
        ieltsId: testInfo.ieltsId || "",
        sections: testInfo.sections || [],
      });
      form.setFieldsValue({
        title: testInfo.title || "",
        type: "academic", // Default since WritingTest doesn't have type field yet
        ieltsId: testInfo.ieltsId || "",
        instruction: testInfo.instruction || "",
      });
    }
  }, [isNewTest, initialTestData, test, form]);

  const addSection = () => {
    const newSection: WritingSection = {
      order: testData.sections.length + 1,
      title: `Task ${testData.sections.length + 1}`,
      description: "",
      writingTestId: id || "",
      subParts: [],
      questions: [], // Add support for direct questions
    };

    setTestData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSection = (index: number, updates: Partial<WritingSection>) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, ...updates } : section
      ),
    }));
  };

  const removeSection = (index: number) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const addSubPart = (sectionIndex: number) => {
    const section = testData.sections[sectionIndex];
    const newSubPart: WritingSubPart = {
      order: (section.subParts?.length || 0) + 1,
      title: `${section.order}.${(section.subParts?.length || 0) + 1}`,
      description: "",
      writingSectionId: section.id || "",
    };

    updateSection(sectionIndex, {
      subParts: [...(section.subParts || []), newSubPart],
    });
  };

  const updateSubPart = (
    sectionIndex: number,
    subPartIndex: number,
    updates: Partial<WritingSubPart>
  ) => {
    const section = testData.sections[sectionIndex];
    const updatedSubParts = (section.subParts || []).map((subPart, i) =>
      i === subPartIndex ? { ...subPart, ...updates } : subPart
    );

    updateSection(sectionIndex, { subParts: updatedSubParts });
  };

  const removeSubPart = (sectionIndex: number, subPartIndex: number) => {
    const section = testData.sections[sectionIndex];
    const updatedSubParts = (section.subParts || []).filter(
      (_, i) => i !== subPartIndex
    );

    updateSection(sectionIndex, { subParts: updatedSubParts });
  };

  // Functions for handling questions directly in sections
  const addQuestionToSection = (sectionIndex: number) => {
    const section = testData.sections[sectionIndex];
    const newQuestion = {
      text: "",
      order: (section.questions?.length || 0) + 1,
      writingSectionId: section.id || "",
    };

    updateSection(sectionIndex, {
      questions: [...(section.questions || []), newQuestion],
    });
  };

  const updateQuestionInSection = (
    sectionIndex: number,
    questionIndex: number,
    updates: Partial<{ text: string; order: number }>
  ) => {
    const section = testData.sections[sectionIndex];
    const updatedQuestions = (section.questions || []).map((question, i) =>
      i === questionIndex ? { ...question, ...updates } : question
    );

    updateSection(sectionIndex, {
      questions: updatedQuestions,
    });
  };

  const removeQuestionFromSection = (
    sectionIndex: number,
    questionIndex: number
  ) => {
    const section = testData.sections[sectionIndex];
    updateSection(sectionIndex, {
      questions: (section.questions || []).filter(
        (_, i) => i !== questionIndex
      ),
    });
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const writingTestData = {
        title: formValues.title,
        instruction: formValues.instruction,
        type: formValues.type,
        ieltsId: formValues.ieltsId,
        sections: testData.sections.map((section) => ({
          order: section.order,
          title: section.title,
          description: section.description || "",
          subParts: (section.subParts || []).map((subPart) => ({
            order: subPart.order,
            label: subPart.title,
            question: subPart.description || `Question for ${subPart.title}`,
            questions: (subPart.questions || []).map((question) => ({
              text: question.text,
              order: question.order,
            })),
          })),
          questions: (section.questions || []).map((question) => ({
            text: question.text,
            order: question.order,
          })),
        })),
      };

      await createTest(writingTestData);
      navigate("/writing");
    } catch (error) {
      console.error("Error saving writing test:", error);
      notification.error({
        message: "Xatolik yuz berdi",
        description: "Writing testni saqlashda xatolik yuz berdi",
      });
    }
  };

  if (isLoading && !isNewTest) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/writing")}
          >
            Orqaga
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewTest ? "Yangi Writing Test" : "Writing Test Tahrirlash"}
            </h1>
          </div>
        </div>
        <Button
          type="primary"
          onClick={handleSave}
          loading={isCreating}
          size="large"
        >
          Saqlash
        </Button>
      </div>

      <Form form={form} layout="vertical" size="large">
        <Card title="📝 Test Ma'lumotlari" className="mb-6">
          <Row gutter={[20, 20]}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Test nomi"
                rules={[{ required: true, message: "Test nomini kiriting" }]}
              >
                <Input
                  placeholder="Test nomini kiriting"
                  onChange={(e) =>
                    setTestData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="instruction"
                label="Ko'rsatma"
                rules={[{ required: true, message: "Ko'rsatmani kiriting" }]}
              >
                <Input
                  placeholder="Test ko'rsatmasini kiriting"
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      instruction: e.target.value,
                    }))
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[20, 20]}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Test turi"
                rules={[{ required: true, message: "Test turini tanlang" }]}
              >
                <Select
                  placeholder="Test turini tanlang"
                  onChange={(value) =>
                    setTestData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <Select.Option value="academic">Academic</Select.Option>
                  <Select.Option value="general">
                    General Training
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ieltsId"
                label="IELTS tanlang"
                rules={[{ required: true, message: "IELTS ni tanlang" }]}
              >
                <Select
                  placeholder="IELTS ni tanlang"
                  loading={isIeltsLoading}
                  onChange={(value) =>
                    setTestData((prev) => ({ ...prev, ieltsId: value }))
                  }
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {ieltsData?.data?.map((ielts) => (
                    <Select.Option key={ielts.id} value={ielts.id}>
                      {ielts.title}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          title="📋 Seksiyalar"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={addSection}>
              Seksiya qo'shish
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {testData.sections.map((section, sectionIndex) => (
              <Card
                key={sectionIndex}
                type="inner"
                title={`Seksiya ${section.order}: ${section.title}`}
                extra={
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeSection(sectionIndex)}
                    size="small"
                  >
                    O'chirish
                  </Button>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <label className="block text-sm font-medium mb-1">
                      Seksiya nomi
                    </label>
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        updateSection(sectionIndex, { title: e.target.value })
                      }
                      placeholder="Seksiya nomini kiriting"
                    />
                  </Col>
                  <Col span={12}>
                    <label className="block text-sm font-medium mb-1">
                      Tavsif
                    </label>
                    <TextArea
                      value={section.description}
                      onChange={(e) =>
                        updateSection(sectionIndex, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Seksiya tavsifini kiriting"
                      rows={2}
                    />
                  </Col>
                </Row>

                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Sub-Parts</h4>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addSubPart(sectionIndex)}
                      size="small"
                    >
                      Sub-Part qo'shish
                    </Button>
                  </div>

                  {(section.subParts || []).map((subPart, subPartIndex) => (
                    <Card
                      key={subPartIndex}
                      size="small"
                      className="mb-2"
                      title={`Sub-Part ${subPart.title}`}
                      extra={
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            removeSubPart(sectionIndex, subPartIndex)
                          }
                          size="small"
                        />
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <label className="block text-sm font-medium mb-1">
                            Label
                          </label>
                          <Input
                            value={subPart.title}
                            onChange={(e) =>
                              updateSubPart(sectionIndex, subPartIndex, {
                                title: e.target.value,
                              })
                            }
                            placeholder="Label"
                          />
                        </Col>
                        <Col span={16}>
                          <label className="block text-sm font-medium mb-1">
                            Savol/Tavsif
                          </label>
                          <TextArea
                            value={subPart.description}
                            onChange={(e) =>
                              updateSubPart(sectionIndex, subPartIndex, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Savol yoki tavsifni kiriting"
                            rows={2}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}

                  {(!section.subParts || section.subParts.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                      <p>
                        Hali sub-part qo'shilmagan. "Sub-Part qo'shish"
                        tugmasini bosing.
                      </p>
                    </div>
                  )}
                </div>

                {/* Direct Questions Section */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Direct Questions</h4>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addQuestionToSection(sectionIndex)}
                      size="small"
                    >
                      Savol qo'shish
                    </Button>
                  </div>

                  {(section.questions || []).map((question, questionIndex) => (
                    <Card
                      key={questionIndex}
                      size="small"
                      className="mb-2"
                      title={`Savol ${question.order}`}
                      extra={
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            removeQuestionFromSection(
                              sectionIndex,
                              questionIndex
                            )
                          }
                          size="small"
                        />
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <label className="block text-sm font-medium mb-1">
                            Savol matni
                          </label>
                          <Input.TextArea
                            value={question.text}
                            onChange={(e) =>
                              updateQuestionInSection(
                                sectionIndex,
                                questionIndex,
                                {
                                  text: e.target.value,
                                }
                              )
                            }
                            placeholder="Savol matnini kiriting"
                            rows={3}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}

                  {(!section.questions || section.questions.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                      <p>
                        Hali savol qo'shilmagan. "Savol qo'shish" tugmasini
                        bosing.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {testData.sections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>
                  Hali seksiya qo'shilmagan. "Seksiya qo'shish" tugmasini
                  bosing.
                </p>
              </div>
            )}
          </Space>
        </Card>
      </Form>
    </div>
  );
}
