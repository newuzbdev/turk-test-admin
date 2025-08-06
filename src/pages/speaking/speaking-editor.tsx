import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  Row,
  Col,
  Collapse,
  Form,
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
import type { SpeakingSection } from "@/utils/types/types";
import { SectionForm, SubPartForm, PointForm, } from "./components";
import {
  useGetOneSpeakingTest,
  useCreateSpeakingTest,
  useSpeakingEditor
} from "@/config/queries/speaking/speaking-editor.queries";
import { useFileUpload } from "@/config/queries/file/upload.queries";


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

  // Queries
  const { data: existingTest, isLoading } = useGetOneSpeakingTest(
    isNewTest ? "" : id || ""
  );
  const { mutateAsync: createSpeakingTest, isPending: isCreating } =
    useCreateSpeakingTest();
  const { mutateAsync: uploadFile } = useFileUpload();

  // Editor utilities
  const {
    addSection,
    updateSection,
    deleteSection,
    addSubPart,
    updateSubPart,
    deleteSubPart,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addPoint,
    updatePoint,
    deletePoint,
    addPointQuestion,
    updatePointQuestion,
    deletePointQuestion,
    handleSectionImageUpload,
    handleSubPartImageUpload,
    removeSectionImage,
    removeSubPartImage,
  } = useSpeakingEditor();

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
              images: subPart.images || [],
              questions:
                subPart.questions?.map((question) => ({
                  order: question.order,
                  question: question.question,
                })) || [],
            })) || [],
          points:
            section.points?.map((point) => ({
              order: point.order,
              type: point.type,
              questions:
                point.questions?.map((question) => ({
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

  const handleDeleteSection = (sectionIndex: number) => {
    Modal.confirm({
      title: "Sectionni o'chirish",
      content: "Haqiqatan ham bu sectionni o'chirmoqchimisiz?",
      onOk: () => deleteSection(testData, setTestData, sectionIndex),
    });
  };

  const handleDeleteSubPart = (sectionIndex: number, subPartIndex: number) => {
    Modal.confirm({
      title: "Sub-partni o'chirish",
      content: "Haqiqatan ham bu sub-partni o'chirmoqchimisiz?",
      onOk: () => deleteSubPart(testData, setTestData, sectionIndex, subPartIndex),
    });
  };

  const handleDeletePoint = (sectionIndex: number, pointIndex: number) => {
    Modal.confirm({
      title: "Pointni o'chirish",
      content: "Haqiqatan ham bu pointni o'chirmoqchimisiz?",
      onOk: () => deletePoint(testData, setTestData, sectionIndex, pointIndex),
    });
  };

  const handleSectionImageUploadWrapper = async (sectionIndex: number, file: File) => {
    await handleSectionImageUpload(testData, setTestData, sectionIndex, file, uploadFile);
  };

  const handleSubPartImageUploadWrapper = async (
    sectionIndex: number,
    subPartIndex: number,
    file: File
  ) => {
    await handleSubPartImageUpload(testData, setTestData, sectionIndex, subPartIndex, file, uploadFile);
  };

  const handleRemoveSectionImage = (sectionIndex: number, imageIndex: number) => {
    removeSectionImage(testData, setTestData, sectionIndex, imageIndex);
  };

  const handleRemoveSubPartImage = (
    sectionIndex: number,
    subPartIndex: number,
    imageIndex: number
  ) => {
    removeSubPartImage(testData, setTestData, sectionIndex, subPartIndex, imageIndex);
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
                onClick={() => addSection(testData, setTestData, id)}
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
                        handleDeleteSection(sectionIndex);
                      }}
                    />
                  }
                >
                  <div className="space-y-4">
                    <SectionForm
                      section={section}
                      sectionIndex={sectionIndex}
                      onUpdate={(sectionIndex, updates) => 
                        updateSection(testData, setTestData, sectionIndex, updates)
                      }
                      onDelete={handleDeleteSection}
                      onImageUpload={handleSectionImageUploadWrapper}
                      onRemoveImage={handleRemoveSectionImage}
                    />

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Sub-Parts</h4>
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => addSubPart(testData, setTestData, sectionIndex)}
                          size="small"
                        >
                          Sub-Part qo'shish
                        </Button>
                      </div>

                      {section.subParts?.map((subPart, subPartIndex) => (
                        <SubPartForm
                          key={subPart.id}
                          subPart={subPart}
                          sectionIndex={sectionIndex}
                          subPartIndex={subPartIndex}
                          onUpdate={(sectionIndex, subPartIndex, updates) =>
                            updateSubPart(testData, setTestData, sectionIndex, subPartIndex, updates)
                          }
                          onDelete={handleDeleteSubPart}
                          onImageUpload={handleSubPartImageUploadWrapper}
                          onRemoveImage={handleRemoveSubPartImage}
                          onAddQuestion={(sectionIndex, subPartIndex) =>
                            addQuestion(testData, setTestData, sectionIndex, subPartIndex)
                          }
                          onUpdateQuestion={(sectionIndex, subPartIndex, questionIndex, updates) =>
                            updateQuestion(testData, setTestData, sectionIndex, subPartIndex, questionIndex, updates)
                          }
                          onDeleteQuestion={(sectionIndex, subPartIndex, questionIndex) =>
                            deleteQuestion(testData, setTestData, sectionIndex, subPartIndex, questionIndex)
                          }
                        />
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Section Questions</h4>
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => addQuestion(testData, setTestData, sectionIndex)}
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
                                  updateSection(testData, setTestData, sectionIndex, {
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
                                updateSection(testData, setTestData, sectionIndex, {
                                  questions: updatedQuestions,
                                });
                              }}
                              placeholder="Question text"
                            />
                          </List.Item>
                        )}
                      />
                    </div>

                    {/* Points Section for Part 3 */}
                    {section.type === "PART3" && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">
                            Advantages & Disadvantages
                          </h4>
                          <div className="space-x-2">
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() =>
                                addPoint(testData, setTestData, sectionIndex, "ADVANTAGE")
                              }
                              size="small"
                            >
                              Advantage qo'shish
                            </Button>
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() =>
                                addPoint(testData, setTestData, sectionIndex, "DISADVANTAGE")
                              }
                              size="small"
                            >
                              Disadvantage qo'shish
                            </Button>
                          </div>
                        </div>

                        {section.points?.map((point, pointIndex) => (
                          <PointForm
                            key={point.id}
                            point={point}
                            sectionIndex={sectionIndex}
                            pointIndex={pointIndex}
                            onUpdate={(sectionIndex, pointIndex, updates) =>
                              updatePoint(testData, setTestData, sectionIndex, pointIndex, updates)
                            }
                            onDelete={handleDeletePoint}
                            onAddQuestion={(sectionIndex, pointIndex) =>
                              addPointQuestion(testData, setTestData, sectionIndex, pointIndex)
                            }
                            onUpdateQuestion={(sectionIndex, pointIndex, questionIndex, updates) =>
                              updatePointQuestion(testData, setTestData, sectionIndex, pointIndex, questionIndex, updates)
                            }
                            onDeleteQuestion={(sectionIndex, pointIndex, questionIndex) =>
                              deletePointQuestion(testData, setTestData, sectionIndex, pointIndex, questionIndex)
                            }
                          />
                        ))}
                      </div>
                    )}
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
