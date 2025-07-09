import {
  Button,
  Input,
  Space,
  Typography,
  Collapse,
  Divider,
  Row,
  Col,
  Select,
  Card,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import type {
  SpeakingTestPayload,
  SpeakingSection,
  SpeakingSubPart,
} from "../../../config/querys/speaking-query";

const { TextArea } = Input;
const { Title } = Typography;
const { Panel } = Collapse;

const sectionTypes = ["PART1", "PART2", "PART3"];

interface Props {
  initialData?: SpeakingTestPayload;
  onSubmit: (payload: SpeakingTestPayload) => void;
  onCancel: () => void;
}

export default function SpeakingForm({
  initialData,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<SpeakingTestPayload>(
    initialData || { title: "", ieltsId: "", sections: [] }
  );

  const updateSection = (index: number, section: SpeakingSection) => {
    const updated = [...form.sections];
    updated[index] = section;
    setForm({ ...form, sections: updated });
  };

  const addSection = () => {
    const newSec: SpeakingSection = {
      order: form.sections.length + 1,
      title: "",
      type: "PART1",
      description: "",
      content: "",
      images: [],
      advantages: [],
      disadvantages: [],
      subParts: [],
      questions: [],
    };
    setForm({ ...form, sections: [...form.sections, newSec] });
  };

  const removeSection = (index: number) => {
    const filtered = form.sections.filter((_, i) => i !== index);
    setForm({ ...form, sections: filtered });
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Title level={4}>📋 Asosiy ma'lumotlar</Title>
      <Row gutter={24}>
        <Col span={12}>
          <label>Test nomi</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Col>
        <Col span={12}>
          <label>IELTS ID</label>
          <Input
            value={form.ieltsId}
            onChange={(e) => setForm({ ...form, ieltsId: e.target.value })}
          />
        </Col>
      </Row>

      <Divider />

      <Title level={4}>🧩 Bo‘limlar</Title>
      <Collapse accordion>
        {form.sections.map((section, index) => (
          <Panel
            key={index}
            header={`${index + 1}-bo‘lim: ${section.title || "No title"}`}
            extra={
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSection(index);
                }}
              />
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <label>Bo‘lim turi</label>
                <Select
                  style={{ width: "100%" }}
                  value={section.type}
                  onChange={(value) =>
                    updateSection(index, { ...section, type: value })
                  }
                  options={sectionTypes.map((t) => ({ value: t, label: t }))}
                />
              </Col>
              <Col span={16}>
                <label>Sarlavha</label>
                <Input
                  value={section.title}
                  onChange={(e) =>
                    updateSection(index, { ...section, title: e.target.value })
                  }
                />
              </Col>
            </Row>

            {section.type === "PART3" && (
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={12}>
                  <label>Afzalliklar</label>
                  <Input
                    value={section.advantages.join(",")}
                    placeholder="Afzalliklarni vergul bilan ajrating"
                    onChange={(e) =>
                      updateSection(index, {
                        ...section,
                        advantages: e.target.value.split(","),
                      })
                    }
                  />
                </Col>
                <Col span={12}>
                  <label>Kamchiliklar</label>
                  <Input
                    value={section.disadvantages.join(",")}
                    placeholder="Kamchiliklarni vergul bilan ajrating"
                    onChange={(e) =>
                      updateSection(index, {
                        ...section,
                        disadvantages: e.target.value.split(","),
                      })
                    }
                  />
                </Col>
              </Row>
            )}

            <label style={{ marginTop: 12 }}>Savol matni</label>
            <TextArea
              rows={2}
              value={section.content}
              onChange={(e) =>
                updateSection(index, { ...section, content: e.target.value })
              }
            />

            <label style={{ marginTop: 12 }}>Tavsif</label>
            <TextArea
              rows={2}
              value={section.description}
              onChange={(e) =>
                updateSection(index, {
                  ...section,
                  description: e.target.value,
                })
              }
            />

            <label style={{ marginTop: 12 }}>Rasmlar (URL vergul bilan)</label>
            <Input
              value={section.images.join(",")}
              onChange={(e) =>
                updateSection(index, {
                  ...section,
                  images: e.target.value.split(","),
                })
              }
            />

            <Divider />

            <Title level={5}>📚 Savollar</Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              {section.questions.map((q, qIndex) => (
                <TextArea
                  key={qIndex}
                  rows={2}
                  placeholder={`Savol ${qIndex + 1}`}
                  value={q.question}
                  onChange={(e) => {
                    const newQuestions = [...section.questions];
                    newQuestions[qIndex] = {
                      ...newQuestions[qIndex],
                      question: e.target.value,
                    };
                    updateSection(index, {
                      ...section,
                      questions: newQuestions,
                    });
                  }}
                />
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() =>
                  updateSection(index, {
                    ...section,
                    questions: [
                      ...section.questions,
                      { order: section.questions.length + 1, question: "" },
                    ],
                  })
                }
              >
                Savol qo‘shish
              </Button>
            </Space>

            <Divider />

            <Title level={5}>🔹 SubParts</Title>
            {section.subParts.map((sp, spIndex) => (
              <Card
                key={spIndex}
                size="small"
                title={`SubPart ${spIndex + 1}`}
                style={{ marginBottom: 12 }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Input
                      placeholder="Label"
                      value={sp.label}
                      onChange={(e) => {
                        const updated = [...section.subParts];
                        updated[spIndex] = { ...sp, label: e.target.value };
                        updateSection(index, { ...section, subParts: updated });
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="Tavsif"
                      value={sp.description}
                      onChange={(e) => {
                        const updated = [...section.subParts];
                        updated[spIndex] = {
                          ...sp,
                          description: e.target.value,
                        };
                        updateSection(index, { ...section, subParts: updated });
                      }}
                    />
                  </Col>
                </Row>

                {sp.questions.map((q, qIndex) => (
                  <TextArea
                    key={qIndex}
                    rows={2}
                    placeholder={`Savol ${qIndex + 1}`}
                    value={q.question}
                    onChange={(e) => {
                      const updatedQuestions = [...sp.questions];
                      updatedQuestions[qIndex] = {
                        ...q,
                        question: e.target.value,
                      };
                      const updatedSP = [...section.subParts];
                      updatedSP[spIndex] = {
                        ...sp,
                        questions: updatedQuestions,
                      };
                      updateSection(index, { ...section, subParts: updatedSP });
                    }}
                  />
                ))}

                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const updatedSP = [...section.subParts];
                    updatedSP[spIndex] = {
                      ...sp,
                      questions: [
                        ...sp.questions,
                        { order: sp.questions.length + 1, question: "" },
                      ],
                    };
                    updateSection(index, { ...section, subParts: updatedSP });
                  }}
                >
                  Savol qo‘shish
                </Button>
              </Card>
            ))}

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                const newSP: SpeakingSubPart = {
                  label: "",
                  description: "",
                  questions: [],
                };
                updateSection(index, {
                  ...section,
                  subParts: [...section.subParts, newSP],
                });
              }}
            >
              SubPart qo‘shish
            </Button>
          </Panel>
        ))}
      </Collapse>

      <Button icon={<PlusOutlined />} onClick={addSection} block>
        Bo‘lim qo‘shish
      </Button>

      <Divider />

      <Space>
        <Button onClick={onCancel}>Bekor qilish</Button>
        <Button type="primary" onClick={() => onSubmit(form)}>
          Saqlash
        </Button>
      </Space>
    </Space>
  );
}
