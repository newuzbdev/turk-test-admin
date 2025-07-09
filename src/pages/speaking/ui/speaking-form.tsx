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
import {
  type SpeakingTestPayload,
  type SpeakingSection,
  type SpeakingSubPart,
  useUpdateSpeakingSection,
  useUpdateSubPart,
  useUpdateQuestion,
  useUpdateSpeakingTest,
  useDeleteQuestion,
  useDeleteSubPart,
  useDeleteSpeakingSection,
  useCreateSpeakingSection,
  useCreateQuestion,
  useCreateSubPart,
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

  const updateTest = useUpdateSpeakingTest();
  const createSection = useCreateSpeakingSection();
  const updateSection = useUpdateSpeakingSection();
  const deleteSection = useDeleteSpeakingSection();

  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const createSubPart = useCreateSubPart();
  const updateSubPart = useUpdateSubPart();
  const deleteSubPart = useDeleteSubPart();

  const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
  const handleSubmit = async () => {
    if (!initialData) {
      onSubmit(form);
      return;
    }

    const updatedTest = form;
    const testId = (initialData as any).id;

    if (
      updatedTest.title !== initialData.title ||
      updatedTest.ieltsId !== initialData.ieltsId
    ) {
      await updateTest.mutateAsync({
        id: testId,
        title: updatedTest.title,
        ieltsId: updatedTest.ieltsId,
        sections: [],
      });
    }

    const initialSectionIds = initialData.sections.map((s: any) => s.id);
    const currentSectionIds = updatedTest.sections.map((s: any) => s.id);

    for (const section of initialData.sections) {
      if (!currentSectionIds.includes(section.id)) {
        await deleteSection.mutateAsync(section.id);
      }
    }

    for (let i = 0; i < updatedTest.sections.length; i++) {
      const section = updatedTest.sections[i];
      const origSection = initialData.sections.find(
        (s: any) => s.id === section.id
      );

      let sectionId = section.id;

      if (!sectionId) {
        const created = await createSection.mutateAsync({
          speakingTestId: testId,
          order: section.order,
          type: section.type,
          title: section.title,
          description: section.description,
          content: section.content,
          images: section.images,
        });
        sectionId = created.id;
      } else if (!deepEqual(section, origSection)) {
        const { questions, subParts, ...sectionRest } = section;
        await updateSection.mutateAsync({ id: sectionId, ...sectionRest });
      }

      const origQuestions = origSection?.questions || [];
      const origQuestionIds = origQuestions.map((q: any) => q.id);
      const currentQuestionIds = section.questions.map((q: any) => q.id);

      for (const oq of origQuestions) {
        if (!currentQuestionIds.includes(oq.id)) {
          await deleteQuestion.mutateAsync(oq.id);
        }
      }

      for (const q of section.questions) {
        if (!q.id) {
          await createQuestion.mutateAsync({
            speakingSectionId: sectionId!,
            order: q.order,
            question: q.question,
          });
        } else {
          const oldQ = origQuestions.find((oq: any) => oq.id === q.id);
          if (!deepEqual(q, oldQ)) {
            await updateQuestion.mutateAsync({ id: q.id, ...q });
          }
        }
      }

      const origSubParts = origSection?.subParts || [];
      const origSubIds = origSubParts.map((sp: any) => sp.id);
      const currentSubIds = section.subParts.map((sp: any) => sp.id);

      for (const sp of origSubParts) {
        if (!currentSubIds.includes(sp.id)) {
          await deleteSubPart.mutateAsync(sp.id);
        }
      }

      for (const sp of section.subParts) {
        let subPartId = sp.id;
        const origSP = origSubParts.find((osp: any) => osp.id === sp.id);

        if (!subPartId) {
          const created = await createSubPart.mutateAsync({
            speakingSectionId: sectionId!,
            label: sp.label,
            description: sp.description,
          });
          subPartId = created.id;
        } else if (!deepEqual(sp, origSP)) {
          const { questions, ...subRest } = sp;
          await updateSubPart.mutateAsync({ id: subPartId, ...subRest });
        }

        const origSPQuestions = origSP?.questions || [];
        const origSPQIds = origSPQuestions.map((q: any) => q.id);
        const currentSPQIds = sp.questions.map((q: any) => q.id);

        for (const oq of origSPQuestions) {
          if (!currentSPQIds.includes(oq.id)) {
            await deleteQuestion.mutateAsync(oq.id);
          }
        }

        for (const q of sp.questions) {
          if (!q.id) {
            await createQuestion.mutateAsync({
              speakingSectionId: sectionId!,
              order: q.order,
              question: q.question,
            });
          } else {
            const oldQ = origSPQuestions.find((oq: any) => oq.id === q.id);
            if (!deepEqual(q, oldQ)) {
              await updateQuestion.mutateAsync({ id: q.id, ...q });
            }
          }
        }
      }
    }

    onSubmit(updatedTest);
  };

  const addSection = () => {
    const newSection: SpeakingSection = {
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
    setForm({ ...form, sections: [...form.sections, newSection] });
  };

  const removeSection = async (index: number) => {
    const section = form.sections[index];

    if ((section as any)?.id) {
      await deleteSection.mutateAsync((section as any).id);
    }

    const updatedSections = form.sections.filter((_, i) => i !== index);
    setForm({ ...form, sections: updatedSections });
  };
  const removeQuestion = async (sectionIndex: number, qIndex: number) => {
    const updated = [...form.sections];
    const question = updated[sectionIndex].questions[qIndex];

    if ((question as any)?.id) {
      await deleteQuestion.mutateAsync((question as any).id);
    }

    updated[sectionIndex].questions.splice(qIndex, 1);
    setForm({ ...form, sections: updated });
  };

  const removeSubPart = async (sectionIndex: number, spIndex: number) => {
    const updated = [...form.sections];
    const subPart = updated[sectionIndex].subParts[spIndex];

    if ((subPart as any)?.id) {
      await deleteSubPart.mutateAsync((subPart as any).id);
    }

    updated[sectionIndex].subParts.splice(spIndex, 1);
    setForm({ ...form, sections: updated });
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
            header={`${index + 1}-bo‘lim: ${section.title || "Sarlavhasiz"}`}
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
                  value={section.type}
                  style={{ width: "100%" }}
                  options={sectionTypes.map((t) => ({ value: t, label: t }))}
                  onChange={(value) => {
                    const updated = [...form.sections];
                    updated[index] = { ...section, type: value };
                    setForm({ ...form, sections: updated });
                  }}
                />
              </Col>
              <Col span={16}>
                <label>Sarlavha</label>
                <Input
                  value={section.title}
                  onChange={(e) => {
                    const updated = [...form.sections];
                    updated[index] = { ...section, title: e.target.value };
                    setForm({ ...form, sections: updated });
                  }}
                />
              </Col>
            </Row>
            {section.type === "PART3" && (
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={12}>
                  <label>Afzalliklar</label>
                  <Input
                    value={section.advantages.join(",")}
                    placeholder="Afzalliklar, vergul bilan"
                    onChange={(e) => {
                      const updated = [...form.sections];
                      updated[index] = {
                        ...section,
                        advantages: e.target.value.split(","),
                      };
                      setForm({ ...form, sections: updated });
                    }}
                  />
                </Col>
                <Col span={12}>
                  <label>Kamchiliklar</label>
                  <Input
                    value={section.disadvantages.join(",")}
                    placeholder="Kamchiliklar, vergul bilan"
                    onChange={(e) => {
                      const updated = [...form.sections];
                      updated[index] = {
                        ...section,
                        disadvantages: e.target.value.split(","),
                      };
                      setForm({ ...form, sections: updated });
                    }}
                  />
                </Col>
              </Row>
            )}

            <label style={{ marginTop: 12 }}>Savol matni</label>
            <TextArea
              rows={2}
              value={section.content}
              onChange={(e) => {
                const updated = [...form.sections];
                updated[index] = { ...section, content: e.target.value };
                setForm({ ...form, sections: updated });
              }}
            />

            <label style={{ marginTop: 12 }}>Tavsif</label>
            <TextArea
              rows={2}
              value={section.description}
              onChange={(e) => {
                const updated = [...form.sections];
                updated[index] = { ...section, description: e.target.value };
                setForm({ ...form, sections: updated });
              }}
            />

            <label style={{ marginTop: 12 }}>Rasmlar (URL, vergul bilan)</label>
            <Input
              value={section.images.join(",")}
              onChange={(e) => {
                const updated = [...form.sections];
                updated[index] = {
                  ...section,
                  images: e.target.value.split(","),
                };
                setForm({ ...form, sections: updated });
              }}
            />

            <Divider />
            <Title level={5} style={{ marginTop: 16 }}>
              📚 Savollar
            </Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              {section.questions.map((q, qIndex) => (
                <div key={qIndex} style={{ position: "relative" }}>
                  <TextArea
                    rows={2}
                    placeholder={`Savol ${qIndex + 1}`}
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...form.sections];
                      const questions = [...section.questions];
                      questions[qIndex] = {
                        ...questions[qIndex],
                        question: e.target.value,
                      };
                      updated[index] = { ...section, questions };
                      setForm({ ...form, sections: updated });
                    }}
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    style={{ position: "absolute", top: 0, right: 0 }}
                    onClick={() => removeQuestion(index, qIndex)}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  const updated = [...form.sections];
                  updated[index] = {
                    ...section,
                    questions: [
                      ...section.questions,
                      { order: section.questions.length + 1, question: "" },
                    ],
                  };
                  setForm({ ...form, sections: updated });
                }}
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
                extra={
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => removeSubPart(index, spIndex)}
                  />
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Input
                      placeholder="Label"
                      value={sp.label}
                      onChange={(e) => {
                        const subParts = [...section.subParts];
                        subParts[spIndex] = { ...sp, label: e.target.value };
                        const updated = [...form.sections];
                        updated[index] = { ...section, subParts };
                        setForm({ ...form, sections: updated });
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="Tavsif"
                      value={sp.description}
                      onChange={(e) => {
                        const subParts = [...section.subParts];
                        subParts[spIndex] = {
                          ...sp,
                          description: e.target.value,
                        };
                        const updated = [...form.sections];
                        updated[index] = { ...section, subParts };
                        setForm({ ...form, sections: updated });
                      }}
                    />
                  </Col>
                </Row>

                <div style={{ marginTop: 12 }}>
                  {sp.questions.map((q, qIndex) => (
                    <TextArea
                      key={qIndex}
                      rows={2}
                      placeholder={`Savol ${qIndex + 1}`}
                      value={q.question}
                      onChange={(e) => {
                        const questions = [...sp.questions];
                        questions[qIndex] = {
                          ...questions[qIndex],
                          question: e.target.value,
                        };
                        const subParts = [...section.subParts];
                        subParts[spIndex] = { ...sp, questions };
                        const updated = [...form.sections];
                        updated[index] = { ...section, subParts };
                        setForm({ ...form, sections: updated });
                      }}
                    />
                  ))}

                  <Button
                    size="small"
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      const subParts = [...section.subParts];
                      subParts[spIndex] = {
                        ...sp,
                        questions: [
                          ...sp.questions,
                          { order: sp.questions.length + 1, question: "" },
                        ],
                      };
                      const updated = [...form.sections];
                      updated[index] = { ...section, subParts };
                      setForm({ ...form, sections: updated });
                    }}
                  >
                    Savol qo‘shish
                  </Button>
                </div>
              </Card>
            ))}

            <Button
              icon={<PlusOutlined />}
              type="dashed"
              onClick={() => {
                const newSP: SpeakingSubPart = {
                  label: "",
                  description: "",
                  questions: [],
                };
                const updated = [...form.sections];
                updated[index] = {
                  ...section,
                  subParts: [...section.subParts, newSP],
                };
                setForm({ ...form, sections: updated });
              }}
            >
              SubPart qo‘shish
            </Button>
          </Panel>
        ))}
      </Collapse>

      <Button
        icon={<PlusOutlined />}
        type="dashed"
        onClick={addSection}
        block
        style={{ marginTop: 16 }}
      >
        Bo‘lim qo‘shish
      </Button>

      <Divider />

      <Space>
        <Button onClick={onCancel}>Bekor qilish</Button>
        <Button type="primary" onClick={handleSubmit}>
          Saqlash
        </Button>
      </Space>
    </Space>
  );
}
