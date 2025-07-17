import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  Row,
  Col,
  Collapse,
  Form,
  Select,
  InputNumber,
  List,
  Modal,
  notification,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useGetOneSpeakingTest } from "@/config/queries/speaking/get-one.queries";
import { useCreateSpeakingTest } from "@/config/queries/speaking/create.queries";
import type {
  SpeakingSection,
  SpeakingSubPart,
  SpeakingQuestion,
} from "@/utils/types/types";

const { TextArea } = Input;
const { Panel } = Collapse;

interface SpeakingTestData {
  title: string;
  ieltsId: string;
  sections: SpeakingSection[];
}

export default function SpeakingEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  const [testData, setTestData] = useState<SpeakingTestData>({
    title: "",
    ieltsId: "",
    sections: [],
  });

  const isNewTest = id?.startsWith("temp-") || location.state?.isNew;

  const { data: existingTest, isLoading } = useGetOneSpeakingTest(
    isNewTest ? "" : id || ""
  );
  const { mutateAsync: createSpeakingTest, isPending: isCreating } =
    useCreateSpeakingTest();

  useEffect(() => {
    if (isNewTest && location.state?.testData) {
      setTestData({
        ...location.state.testData,
        sections: [],
      });
      form.setFieldsValue(location.state.testData);
    } else if (existingTest?.data) {
      const test = existingTest.data;
      setTestData({
        title: test.title,
        ieltsId: test.ieltsId,
        sections: test.sections || [],
      });
      form.setFieldsValue({
        title: test.title,
        ieltsId: test.ieltsId,
      });
    }
  }, [existingTest, location.state, isNewTest, form]);

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const speakingTestData = {
        title: formValues.title,
        ieltsId: formValues.ieltsId,
        sections: testData.sections.map((section) => ({
          order: section.order,
          type: section.type,
          title: section.title,
          description: section.description || "",
          content: section.content || "",
          images: section.images || [],
          subParts:
            section.subParts?.map((subPart) => ({
              label: subPart.label,
              description: subPart.description,
              questions:
                subPart.questions?.map((question) => ({
                  order: question.order,
                  question: question.question,
                })) || [],
            })) || [],
        })),
      };

      await createSpeakingTest(speakingTestData);
      navigate("/speaking");
    } catch (error) {
      console.error("Error saving speaking test:", error);
      notification.error({
        message: "Xatolik yuz berdi",
        description: "Speaking testni saqlashda xatolik yuz berdi",
      });
    }
  };

  const addSection = () => {
    const newSection: SpeakingSection = {
      id: `temp-section-${Date.now()}`,
      title: `Section ${testData.sections.length + 1}`,
      description: "",
      content: "",
      order: testData.sections.length + 1,
      type: "PART1",
      speakingTestId: id || "",
      images: [],
      subParts: [],
      questions: [],
    };

    setTestData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSection = (
    sectionIndex: number,
    updates: Partial<SpeakingSection>
  ) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...updates } : section
      ),
    }));
  };

  const deleteSection = (sectionIndex: number) => {
    Modal.confirm({
      title: "Sectionni o'chirish",
      content: "Haqiqatan ham bu sectionni o'chirmoqchimisiz?",
      onOk: () => {
        setTestData((prev) => ({
          ...prev,
          sections: prev.sections.filter((_, index) => index !== sectionIndex),
        }));
      },
    });
  };

  const addSubPart = (sectionIndex: number) => {
    const newSubPart: SpeakingSubPart = {
      id: `temp-subpart-${Date.now()}`,
      label: `${testData.sections[sectionIndex].order}.${
        (testData.sections[sectionIndex].subParts?.length || 0) + 1
      }`,
      description: "",
      speakingSectionId: testData.sections[sectionIndex].id || "",
      order: (testData.sections[sectionIndex].subParts?.length || 0) + 1,
      questions: [],
    };

    updateSection(sectionIndex, {
      subParts: [
        ...(testData.sections[sectionIndex].subParts || []),
        newSubPart,
      ],
    });
  };

  const updateSubPart = (
    sectionIndex: number,
    subPartIndex: number,
    updates: Partial<SpeakingSubPart>
  ) => {
    const updatedSubParts = [
      ...(testData.sections[sectionIndex].subParts || []),
    ];
    updatedSubParts[subPartIndex] = {
      ...updatedSubParts[subPartIndex],
      ...updates,
    };
    updateSection(sectionIndex, { subParts: updatedSubParts });
  };

  const deleteSubPart = (sectionIndex: number, subPartIndex: number) => {
    Modal.confirm({
      title: "Sub-partni o'chirish",
      content: "Haqiqatan ham bu sub-partni o'chirmoqchimisiz?",
      onOk: () => {
        const updatedSubParts =
          testData.sections[sectionIndex].subParts?.filter(
            (_, index) => index !== subPartIndex
          ) || [];
        updateSection(sectionIndex, { subParts: updatedSubParts });
      },
    });
  };

  const addQuestion = (sectionIndex: number, subPartIndex?: number) => {
    const newQuestion: SpeakingQuestion = {
      id: `temp-question-${Date.now()}`,
      question: "",
      order: 1,
    };

    if (subPartIndex !== undefined) {
      // Add to sub-part
      const updatedSubParts = [
        ...(testData.sections[sectionIndex].subParts || []),
      ];
      const subPart = updatedSubParts[subPartIndex];
      newQuestion.order = (subPart.questions?.length || 0) + 1;
      newQuestion.speakingSubPartId = subPart.id;

      updatedSubParts[subPartIndex] = {
        ...subPart,
        questions: [...(subPart.questions || []), newQuestion],
      };
      updateSection(sectionIndex, { subParts: updatedSubParts });
    } else {
      // Add to section
      newQuestion.order =
        (testData.sections[sectionIndex].questions?.length || 0) + 1;
      newQuestion.speakingSectionId = testData.sections[sectionIndex].id;

      updateSection(sectionIndex, {
        questions: [
          ...(testData.sections[sectionIndex].questions || []),
          newQuestion,
        ],
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/speaking")}
          >
            Orqaga
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewTest ? "Yangi Speaking Test" : "Speaking Test Tahrirlash"}
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

      <Row gutter={24}>
        <Col span={24}>
          <Card title="Test Ma'lumotlari" className="mb-6">
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="title"
                    label="Test nomi"
                    rules={[
                      { required: true, message: "Test nomini kiriting" },
                    ]}
                  >
                    <Input
                      placeholder="Test nomini kiriting"
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="ieltsId"
                    label="IELTS ID"
                    rules={[
                      { required: true, message: "IELTS ID ni kiriting" },
                    ]}
                  >
                    <Input
                      placeholder="IELTS ID"
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          ieltsId: e.target.value,
                        }))
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card
            title="Sectionlar"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addSection}
              >
                Section qo'shish
              </Button>
            }
          >
            <Collapse>
              {testData.sections.map((section, sectionIndex) => (
                <Panel
                  key={section.id || `section-${sectionIndex}`}
                  header={`${section.title} (${section.type})`}
                  extra={
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(sectionIndex);
                      }}
                    />
                  }
                >
                  <div className="space-y-4">
                    <Row gutter={16}>
                      <Col span={8}>
                        <label className="block text-sm font-medium mb-1">
                          Title
                        </label>
                        <Input
                          value={section.title}
                          onChange={(e) =>
                            updateSection(sectionIndex, {
                              title: e.target.value,
                            })
                          }
                          placeholder="Section title"
                        />
                      </Col>
                      <Col span={8}>
                        <label className="block text-sm font-medium mb-1">
                          Type
                        </label>
                        <Select
                          value={section.type}
                          onChange={(value) =>
                            updateSection(sectionIndex, { type: value })
                          }
                          style={{ width: "100%" }}
                        >
                          <Select.Option value="PART1">Part 1</Select.Option>
                          <Select.Option value="PART2">Part 2</Select.Option>
                          <Select.Option value="PART3">Part 3</Select.Option>
                        </Select>
                      </Col>
                      <Col span={8}>
                        <label className="block text-sm font-medium mb-1">
                          Order
                        </label>
                        <InputNumber
                          value={section.order}
                          onChange={(value) =>
                            updateSection(sectionIndex, { order: value || 1 })
                          }
                          min={1}
                          style={{ width: "100%" }}
                        />
                      </Col>
                    </Row>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <TextArea
                        value={section.description}
                        onChange={(e) =>
                          updateSection(sectionIndex, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Section description"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Content
                      </label>
                      <TextArea
                        value={section.content}
                        onChange={(e) =>
                          updateSection(sectionIndex, {
                            content: e.target.value,
                          })
                        }
                        placeholder="Section content"
                        rows={3}
                      />
                    </div>

                    <div className="border-t pt-4">
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

                      {section.subParts?.map((subPart, subPartIndex) => (
                        <Card
                          key={subPart.id}
                          size="small"
                          className="mb-3"
                          title={`Sub-Part: ${subPart.label}`}
                          extra={
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                deleteSubPart(sectionIndex, subPartIndex)
                              }
                            />
                          }
                        >
                          <Row gutter={16}>
                            <Col span={12}>
                              <label className="block text-sm font-medium mb-1">
                                Label
                              </label>
                              <Input
                                value={subPart.label}
                                onChange={(e) =>
                                  updateSubPart(sectionIndex, subPartIndex, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Sub-part label"
                              />
                            </Col>
                            <Col span={12}>
                              <label className="block text-sm font-medium mb-1">
                                Description
                              </label>
                              <Input
                                value={subPart.description}
                                onChange={(e) =>
                                  updateSubPart(sectionIndex, subPartIndex, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Sub-part description"
                              />
                            </Col>
                          </Row>

                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">
                                Questions
                              </span>
                              <Button
                                type="link"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                  addQuestion(sectionIndex, subPartIndex)
                                }
                                size="small"
                              >
                                Question qo'shish
                              </Button>
                            </div>
                            <List
                              size="small"
                              dataSource={subPart.questions || []}
                              renderItem={(question, questionIndex) => (
                                <List.Item
                                  actions={[
                                    <Button
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={() => {
                                        const updatedSubParts = [
                                          ...(testData.sections[sectionIndex]
                                            .subParts || []),
                                        ];
                                        const updatedQuestions =
                                          subPart.questions?.filter(
                                            (_, index) =>
                                              index !== questionIndex
                                          ) || [];
                                        updatedSubParts[subPartIndex] = {
                                          ...subPart,
                                          questions: updatedQuestions,
                                        };
                                        updateSection(sectionIndex, {
                                          subParts: updatedSubParts,
                                        });
                                      }}
                                    />,
                                  ]}
                                >
                                  <Input
                                    value={question.question}
                                    onChange={(e) => {
                                      const updatedSubParts = [
                                        ...(testData.sections[sectionIndex]
                                          .subParts || []),
                                      ];
                                      const updatedQuestions = [
                                        ...(subPart.questions || []),
                                      ];
                                      updatedQuestions[questionIndex] = {
                                        ...question,
                                        question: e.target.value,
                                      };
                                      updatedSubParts[subPartIndex] = {
                                        ...subPart,
                                        questions: updatedQuestions,
                                      };
                                      updateSection(sectionIndex, {
                                        subParts: updatedSubParts,
                                      });
                                    }}
                                    placeholder="Question text"
                                  />
                                </List.Item>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Section Questions</h4>
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => addQuestion(sectionIndex)}
                          size="small"
                        >
                          Question qo'shish
                        </Button>
                      </div>

                      <List
                        size="small"
                        dataSource={section.questions || []}
                        renderItem={(question, questionIndex) => (
                          <List.Item
                            actions={[
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  const updatedQuestions =
                                    section.questions?.filter(
                                      (_, index) => index !== questionIndex
                                    ) || [];
                                  updateSection(sectionIndex, {
                                    questions: updatedQuestions,
                                  });
                                }}
                              />,
                            ]}
                          >
                            <Input
                              value={question.question}
                              onChange={(e) => {
                                const updatedQuestions = [
                                  ...(section.questions || []),
                                ];
                                updatedQuestions[questionIndex] = {
                                  ...question,
                                  question: e.target.value,
                                };
                                updateSection(sectionIndex, {
                                  questions: updatedQuestions,
                                });
                              }}
                              placeholder="Question text"
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  </div>
                </Panel>
              ))}
            </Collapse>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
