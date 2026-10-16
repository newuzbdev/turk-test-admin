import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Tabs,
  Typography,
} from "antd";
import { Plus, Trash2 } from "lucide-react";

import { listeningPracticeEndpoints } from "@/config/endpoint";
import PracticeContentEditorShell from "@/pages/practice-admin/practice-content-editor-shell";
import {
  asArray,
  clone,
  createPracticeId,
  PracticeField,
} from "@/pages/practice-admin/editor-utils";

import ListeningPracticeFeedbackEditor from "./listening-practice-feedback-editor";
import {
  changePracticeAudio,
  changePracticeTranscript,
  type PracticeContent,
  type PracticeSection,
  type PracticeQuestion,
  type PracticeAnswer,
} from "./listening-practice-feedback-model";

import ListeningPracticeGlossaryEditor from "./listening-practice-glossary-editor";

const sectionLabel = (code: string) => `Bölüm ${code.replace("PART_", "")}`;

function ListeningPracticeFields({
  content,
  onChange,
}: {
  content: PracticeContent;
  onChange: (content: PracticeContent) => void;
}) {
  const part = content?.parts?.[0];
  const sections = asArray<PracticeSection>(part?.sections);
  if (!part || sections.length === 0) {
    return <Alert type="error" message="Dinleme pratiği içeriği eksik." />;
  }

  const patchRoot = (patch: Record<string, unknown>) =>
    onChange({ ...content, ...patch });
  const patchPart = (patch: Record<string, unknown>) => {
    const next = clone(content);
    next.parts[0] = { ...next.parts[0], ...patch };
    onChange(next);
  };
  const patchSection = (
    sectionIndex: number,
    patch: Record<string, unknown>,
  ) => {
    const next = clone(content);
    next.parts[0].sections[sectionIndex] = {
      ...next.parts[0].sections[sectionIndex],
      ...patch,
    };
    onChange(next);
  };
  const patchQuestion = (
    sectionIndex: number,
    questionIndex: number,
    patch: Record<string, unknown>,
  ) => {
    const next = clone(content);
    next.parts[0].sections[sectionIndex].questions[questionIndex] = {
      ...next.parts[0].sections[sectionIndex].questions[questionIndex],
      ...patch,
    };
    onChange(next);
  };
  const addQuestion = (sectionIndex: number) => {
    const next = clone(content);
    const questions = asArray<PracticeQuestion>(
      next.parts[0].sections[sectionIndex].questions,
    );
    const number =
      Math.max(
        0,
        ...sections.flatMap((section) =>
          asArray<PracticeQuestion>(section.questions).map(
            (question) => Number(question.number) || 0,
          ),
        ),
      ) + 1;
    questions.push({
      id: createPracticeId(),
      number,
      type: "MULTIPLE_CHOICE",
      text: "",
      content: "",
      imageUrl: null,
      answers: ["A", "B", "C"].map((variant, index) => ({
        id: createPracticeId(),
        variantText: variant,
        answer: "",
        correct: index === 0,
      })),
    });
    next.parts[0].sections[sectionIndex].questions = questions;
    onChange(next);
  };
  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const next = clone(content);
    next.parts[0].sections[sectionIndex].questions.splice(questionIndex, 1);
    onChange(next);
  };
  const addAnswer = (sectionIndex: number, questionIndex: number) => {
    const next = clone(content);
    const question =
      next.parts[0].sections[sectionIndex].questions[questionIndex];
    const answers = asArray<PracticeAnswer>(question.answers);
    answers.push({
      id: createPracticeId(),
      variantText: String.fromCharCode(65 + answers.length),
      answer: "",
      correct: answers.length === 0,
    });
    question.answers = answers;
    onChange(next);
  };
  const removeAnswer = (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number,
  ) => {
    const next = clone(content);
    const question =
      next.parts[0].sections[sectionIndex].questions[questionIndex];
    const answers = asArray<PracticeAnswer>(question.answers);
    const removedWasCorrect = Boolean(answers[answerIndex]?.correct);
    answers.splice(answerIndex, 1);
    if (removedWasCorrect && answers[0]) answers[0].correct = true;
    question.answers = answers;
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <PracticeField label="Ses dosyası adresi">
          <Input
            value={content.audioUrl || ""}
            placeholder="Ses dosyası adresi"
            onChange={(event) =>
              onChange(changePracticeAudio(content, event.target.value))
            }
          />
        </PracticeField>
        <PracticeField label="Ses süresi (saniye)">
          <InputNumber
            className="w-full"
            min={0}
            value={content.audioDurationSeconds ?? null}
            onChange={(value) => patchRoot({ audioDurationSeconds: value })}
          />
        </PracticeField>
      </div>
      <PracticeField label="Bölüm talimatı">
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 5 }}
          value={part.description || ""}
          onChange={(event) => patchPart({ description: event.target.value })}
        />
      </PracticeField>

      {sections.map((section, sectionIndex) => (
        <Card
          key={section.id || sectionIndex}
          title={section.title || `İçerik ${sectionIndex + 1}`}
          extra={
            <Button
              size="small"
              icon={<Plus size={14} />}
              onClick={() => addQuestion(sectionIndex)}
            >
              Soru ekle
            </Button>
          }
        >
          <div className="space-y-5">
            <PracticeField label="Dinleme metni">
              <Input.TextArea
                autoSize={{ minRows: 5, maxRows: 14 }}
                value={section.transcript || ""}
                onChange={(event) =>
                  patchSection(
                    sectionIndex,
                    changePracticeTranscript(section, event.target.value),
                  )
                }
              />
            </PracticeField>
            <PracticeField label="Bölüm görseli">
              <Input
                value={section.imageUrl || ""}
                placeholder="İsteğe bağlı görsel adresi"
                onChange={(event) =>
                  patchSection(sectionIndex, { imageUrl: event.target.value })
                }
              />
            </PracticeField>

            {asArray<PracticeQuestion>(section.questions).map(
              (question, questionIndex) => (
                <Card
                  key={question.id || questionIndex}
                  size="small"
                  title={`Soru ${question.number || questionIndex + 1}`}
                  extra={
                    <Popconfirm
                      title="Bu soru silinsin mi?"
                      onConfirm={() =>
                        removeQuestion(sectionIndex, questionIndex)
                      }
                    >
                      <Button danger type="text" icon={<Trash2 size={15} />} />
                    </Popconfirm>
                  }
                >
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <PracticeField label="Soru türü">
                        <Select
                          className="w-full"
                          value={question.type || "MULTIPLE_CHOICE"}
                          options={[
                            {
                              value: "MULTIPLE_CHOICE",
                              label: "Çoktan seçmeli",
                            },
                            { value: "TRUE_FALSE", label: "Doğru / Yanlış" },
                            { value: "MATCHING", label: "Eşleştirme" },
                          ]}
                          onChange={(type) =>
                            patchQuestion(sectionIndex, questionIndex, { type })
                          }
                        />
                      </PracticeField>
                      <PracticeField label="Soru">
                        <Input.TextArea
                          autoSize={{ minRows: 2, maxRows: 5 }}
                          value={question.text || question.content || ""}
                          onChange={(event) =>
                            patchQuestion(sectionIndex, questionIndex, {
                              text: event.target.value,
                              content: event.target.value,
                            })
                          }
                        />
                      </PracticeField>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Typography.Text strong>Seçenekler</Typography.Text>
                        <Button
                          size="small"
                          icon={<Plus size={14} />}
                          onClick={() => addAnswer(sectionIndex, questionIndex)}
                        >
                          Seçenek ekle
                        </Button>
                      </div>
                      {asArray<PracticeAnswer>(question.answers).map(
                        (answer, answerIndex) => (
                          <div
                            key={answer.id || answerIndex}
                            className="grid gap-2 md:grid-cols-[70px_1fr_130px_40px]"
                          >
                            <Input
                              value={answer.variantText || ""}
                              onChange={(event) => {
                                const answers = clone(question.answers || []);
                                answers[answerIndex].variantText =
                                  event.target.value;
                                patchQuestion(sectionIndex, questionIndex, {
                                  answers,
                                });
                              }}
                            />
                            <Input
                              value={answer.answer || ""}
                              placeholder="Seçenek metni"
                              onChange={(event) => {
                                const answers = clone(question.answers || []);
                                answers[answerIndex].answer =
                                  event.target.value;
                                patchQuestion(sectionIndex, questionIndex, {
                                  answers,
                                });
                              }}
                            />
                            <Button
                              type={answer.correct ? "primary" : "default"}
                              onClick={() => {
                                const answers = clone(
                                  question.answers || [],
                                ).map(
                                  (item: PracticeAnswer, index: number) => ({
                                    ...item,
                                    correct: index === answerIndex,
                                  }),
                                );
                                patchQuestion(sectionIndex, questionIndex, {
                                  answers,
                                });
                              }}
                            >
                              {answer.correct ? "Doğru cevap" : "Doğru seç"}
                            </Button>
                            <Button
                              aria-label="Seçeneği sil"
                              danger
                              type="text"
                              icon={<Trash2 size={15} />}
                              onClick={() =>
                                removeAnswer(
                                  sectionIndex,
                                  questionIndex,
                                  answerIndex,
                                )
                              }
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </Card>
              ),
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ListeningPracticeEditor() {
  return (
    <PracticeContentEditorShell
      domainLabel="Dinleme"
      listPath="/listening-practice"
      adminOne={listeningPracticeEndpoints.adminOne}
      contentEndpoint={listeningPracticeEndpoints.content}
      sectionLabel={sectionLabel}
    >
      {({ content, onChange }) => (
        <Tabs
          defaultActiveKey="content"
          destroyOnHidden
          items={[
            { key: "glossary", label: "Sözlük", children: <ListeningPracticeGlossaryEditor content={content} onChange={onChange} /> },
            {
              key: "content",
              label: "İçerik ve sorular",
              children: (
                <ListeningPracticeFields
                  content={content}
                  onChange={onChange}
                />
              ),
            },
            {
              key: "feedback",
              label: "Transkript ve cevaplar",
              children: (
                <ListeningPracticeFeedbackEditor
                  content={content}
                  onChange={onChange}
                />
              ),
            },
          ]}
        />
      )}
    </PracticeContentEditorShell>
  );
}
