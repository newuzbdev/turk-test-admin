import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Input, Row, Col, Space, Form, notification } from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useGetOneWritingTest } from "@/config/queries/writing/get-one.queries";
import { useCreateWritingTestWithAddition } from "@/config/queries/writing/create.queries";
import type { WritingSection, WritingSubPart } from "@/utils/types/types";

const { TextArea } = Input;

interface WritingTestData {
  title: string;
  instruction: string;
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

  // Initialize test data from location state or API
  useEffect(() => {
    if (isNewTest && initialTestData) {
      setTestData((prev) => ({
        ...prev,
        title: initialTestData.title || "",
        ieltsId: initialTestData.ieltsId || "",
        instruction: "You have 60 minutes to complete both tasks.",
      }));
      form.setFieldsValue({
        title: initialTestData.title || "",
        ieltsId: initialTestData.ieltsId || "",
        instruction: "You have 60 minutes to complete both tasks.",
      });
    } else if (test?.data && !isNewTest) {
      const testInfo = test.data;
      setTestData({
        title: testInfo.title || "",
        instruction: testInfo.instruction || "",
        ieltsId: testInfo.ieltsId || "",
        sections: testInfo.sections || [],
      });
      form.setFieldsValue({
        title: testInfo.title || "",
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

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const writingTestData = {
        title: formValues.title,
        instruction: formValues.instruction,
        ieltsId: formValues.ieltsId,
        sections: testData.sections.map((section) => ({
          order: section.order,
          title: section.title,
          description: section.description || "",
          subParts: (section.subParts || []).map((subPart) => ({
            order: subPart.order,
            label: subPart.title,
            question: subPart.description || `Question for ${subPart.title}`,
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
