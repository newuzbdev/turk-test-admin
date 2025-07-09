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
  notification,
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
  useCreateSubPart,
  useCreateQuestion,
  useCreateSpeakingPoint,
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

  const updateSection = useUpdateSpeakingSection();
  const updateSubPart = useUpdateSubPart();
  const updateQuestion = useUpdateQuestion();
  const updateTest = useUpdateSpeakingTest();
  const deleteQuestion = useDeleteQuestion();
  const deleteSubPart = useDeleteSubPart();
  const deleteSection = useDeleteSpeakingSection();
  const createSection = useCreateSpeakingSection();
  const createSubPart = useCreateSubPart();
  const createQuestion = useCreateQuestion();
  const createPoint = useCreateSpeakingPoint();

  const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
  const deepEqualWithoutId = (a: any, b: any) => {
    const clean = (obj: any) =>
      JSON.parse(
        JSON.stringify(obj, (key, value) =>
          key === "id" || key === "__typename" ? undefined : value
        )
      );
    return JSON.stringify(clean(a)) === JSON.stringify(clean(b));
  };
  const handleSubmit = async () => {
    try {
      for (let section of form.sections) {
        for (let q of section.questions) {
          if (
            !q.questionText ||
            typeof q.questionText !== "string" ||
            q.questionText.trim() === ""
          ) {
            throw new Error(
              "Bo‘lim savollarida bo‘sh yoki noto‘g‘ri formatdagi savol mavjud."
            );
          }
        }
        for (let sp of section.subParts) {
          for (let sq of sp.questions) {
            if (
              !sq.questionText ||
              typeof sq.questionText !== "string" ||
              sq.questionText.trim() === ""
            ) {
              throw new Error(
                "SubPart savollarida bo‘sh yoki noto‘g‘ri formatdagi savol mavjud."
              );
            }
          }
        }
      }

      if (!initialData) {
        onSubmit(form);
        return;
      }

      const updatedTest = form;
      const testId = initialData.speakingTestId;
      if (!testId) throw new Error("Test ID topilmadi");

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
        console.log("🔁 updateTest:", {
          id: testId,
          title: updatedTest.title,
          ieltsId: updatedTest.ieltsId,
          sections: [],
        });
      }

      for (let i = 0; i < updatedTest.sections.length; i++) {
        const section = updatedTest.sections[i];
        const origSection = initialData.sections[i];
        const sectionId = (section as any)?.id;

        const { questions, subParts, ...sectionRest } = section;

        if (sectionId) {
          if (!deepEqualWithoutId(sectionRest, origSection)) {
            await updateSection.mutateAsync({ id: sectionId, ...sectionRest });
            console.log("🔁 updateSection:", { id: sectionId, ...sectionRest });
          }

          for (let q = 0; q < questions.length; q++) {
            const qId = (questions[q] as any)?.id;
            const originalQ = origSection?.questions?.[q];

            if (qId) {
              if (!deepEqualWithoutId(questions[q], originalQ)) {
                console.log("🔁 updateQuestion:", { id: qId, ...questions[q] });
                await updateQuestion.mutateAsync({ id: qId, ...questions[q] });
              }
            } else {
              await createQuestion.mutateAsync({
                speakingSectionId: sectionId,
                ...questions[q],
              });
              console.log("🆕 createQuestion (section):", {
                speakingSectionId: sectionId,
                ...questions[q],
              });
            }
          }

          for (let s = 0; s < subParts.length; s++) {
            const sub = subParts[s];
            const origSub = origSection?.subParts?.[s];
            const subId = (sub as any)?.id;
            const { questions: subQs, ...subRest } = sub;

            if (subId) {
              if (!deepEqualWithoutId(subRest, origSub)) {
                console.log("🔁 updateSubPart:", { id: subId, ...subRest });
                await updateSubPart.mutateAsync({ id: subId, ...subRest });
              }

              for (let sq = 0; sq < sub.questions.length; sq++) {
                const sqId = (sub.questions[sq] as any)?.id;
                const originalSQ = origSub?.questions?.[sq];

                if (sqId) {
                  if (!deepEqualWithoutId(sub.questions[sq], originalSQ)) {
                    await updateQuestion.mutateAsync({
                      id: sqId,
                      ...sub.questions[sq],
                    });
                    console.log("🔁 updateQuestion (subpart):", {
                      id: sqId,
                      ...sub.questions[sq],
                    });
                  }
                } else {
                  await createQuestion.mutateAsync({
                    speakingSectionId: sectionId,
                    ...sub.questions[sq],
                  });
                }
              }
            } else {
              const newSub = await createSubPart.mutateAsync({
                speakingSectionId: sectionId,
                label: sub.label,
                description: sub.description,
              });
              console.log("🆕 createSubPart:", {
                speakingSectionId: sectionId,
                label: sub.label,
                description: sub.description,
              });
              for (const q of sub.questions) {
                console.log("🆕 createQuestion (subPart):", {
                  speakingSectionId: sectionId,
                  order: q.order,
                  questionText: q.questionText,
                });
                await createQuestion.mutateAsync({
                  speakingSectionId: sectionId,
                  order: q.order,
                  questionText: q.questionText,
                });
              }
            }
          }

          if (section.type === "PART3") {
            for (let idx = 0; idx < section.advantages.length; idx++) {
              console.log("🆕 createPoint (ADV):", {
                speakingSectionId: sectionId,
                order: idx + 1,
                type: "ADVANTAGE",
                questionText: section.advantages[idx],
              });
              await createPoint.mutateAsync({
                speakingSectionId: sectionId,
                order: idx + 1,
                type: "ADVANTAGE",
                questionText: section.advantages[idx],
              });
            }
            for (let idx = 0; idx < section.disadvantages.length; idx++) {
              console.log("🆕 createPoint (DISADV):", {
                speakingSectionId: sectionId,
                order: idx + 1,
                type: "DISADVANTAGE",
                questionText: section.disadvantages[idx],
              });
              await createPoint.mutateAsync({
                speakingSectionId: sectionId,
                order: idx + 1,
                type: "DISADVANTAGE",
                questionText: section.disadvantages[idx],
              });
            }
          }
        } else {
          const newSec = await createSection.mutateAsync({
            ...sectionRest,
            speakingTestId: testId,
          });

          for (const q of questions) {
            await createQuestion.mutateAsync({
              speakingSectionId: newSec.id,
              order: q.order,
              questionText: q.questionText,
            });
          }

          for (const sp of subParts) {
            const newSP = await createSubPart.mutateAsync({
              speakingSectionId: newSec.id,
              label: sp.label,
              description: sp.description,
            });

            for (const q of sp.questions) {
              await createQuestion.mutateAsync({
                speakingSectionId: newSec.id,
                order: q.order,
                questionText: q.questionText,
              });
            }
          }

          if (section.type === "PART3") {
            for (let idx = 0; idx < section.advantages.length; idx++) {
              await createPoint.mutateAsync({
                speakingSectionId: newSec.id,
                order: idx + 1,
                type: "ADVANTAGE",
                questionText: section.advantages[idx],
              });
            }
            for (let idx = 0; idx < section.disadvantages.length; idx++) {
              await createPoint.mutateAsync({
                speakingSectionId: newSec.id,
                order: idx + 1,
                type: "DISADVANTAGE",
                questionText: section.disadvantages[idx],
              });
            }
          }
        }
      }

      notification.success({ message: "Saqlash muvaffaqiyatli yakunlandi" });
      onSubmit(updatedTest);
    } catch (error: any) {
      notification.error({ message: "Xatolik", description: error.message });
      console.error(error);
    }
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
      speakingTestId: initialData?.speakingTestId || "",
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
                    value={q.questionText}
                    onChange={(e) => {
                      const updated = [...form.sections];
                      const questions = [...section.questions];
                      questions[qIndex] = {
                        ...questions[qIndex],
                        questionText: e.target.value,
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
                      { order: section.questions.length + 1, questionText: "" },
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
                      value={q.questionText}
                      onChange={(e) => {
                        const questions = [...sp.questions];
                        questions[qIndex] = {
                          ...questions[qIndex],
                          questionText: e.target.value,
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
                          { order: sp.questions.length + 1, questionText: "" },
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
