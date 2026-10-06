import { Alert, Card, Divider, Input } from "antd";

import { speakingPracticeEndpoints } from "@/config/endpoint";
import PracticeContentEditorShell from "@/pages/practice-admin/practice-content-editor-shell";
import { asArray, clone, PracticeField } from "@/pages/practice-admin/editor-utils";

const sectionLabels: Record<string, string> = {
  TASK_1_1: "Bölüm 1.1",
  TASK_1_2: "Bölüm 1.2",
  TASK_2: "Bölüm 2",
  TASK_3: "Bölüm 3",
};

function SpeakingPracticeFields({
  sectionCode,
  content,
  onChange,
}: {
  sectionCode: string;
  content: any;
  onChange: (content: any) => void;
}) {
  const section = content?.sections?.[0];
  const task = section?.subParts?.[0];
  if (!section || !task) {
    return <Alert type="error" message="Konuşma pratiği içeriği eksik." />;
  }

  const patchTask = (patch: Record<string, unknown>) => {
    const next = clone(content);
    next.sections[0].subParts[0] = { ...next.sections[0].subParts[0], ...patch };
    onChange(next);
  };
  const patchQuestion = (questionId: string, value: string) => {
    const next = clone(content);
    const question = asArray<any>(next.sections[0].subParts[0].questions).find(
      (item) => item.id === questionId,
    );
    if (question) question.questionText = value;
    onChange(next);
  };
  const patchPoint = (
    type: "ADVANTAGE" | "DISADVANTAGE",
    index: number,
    value: string,
  ) => {
    const next = clone(content);
    const points = asArray<any>(next.sections[0].points).filter(
      (point) => point.type === type,
    );
    if (points[index]) points[index].example = value;
    onChange(next);
  };
  const questions = [...asArray<any>(task.questions)].sort(
    (left, right) => Number(left.order) - Number(right.order),
  );
  const imageCount =
    sectionCode === "TASK_1_2" ? 2 : sectionCode === "TASK_2" ? 1 : 0;
  const images = asArray<string>(task.images);

  return (
    <div className="space-y-6">
      <PracticeField label="Pratik talimatı">
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 5 }}
          value={task.description || ""}
          placeholder="Öğrencinin bu bölümde ne yapacağını kısa ve açık biçimde yazın."
          onChange={(event) => patchTask({ description: event.target.value })}
        />
      </PracticeField>

      {imageCount > 0 ? (
        <div className={`grid gap-4 ${imageCount === 2 ? "md:grid-cols-2" : ""}`}>
          {Array.from({ length: imageCount }, (_, index) => (
            <PracticeField key={index} label={`Görsel ${index + 1}`}>
              <Input
                value={images[index] || ""}
                placeholder="Görsel adresi"
                onChange={(event) => {
                  const nextImages = [...images];
                  nextImages[index] = event.target.value;
                  patchTask({ images: nextImages });
                }}
              />
              {images[index] ? (
                <img
                  src={images[index]}
                  alt={`Konuşma pratiği görseli ${index + 1}`}
                  className={imageCount === 2
                    ? "mt-2 aspect-[3/2] h-auto w-full rounded-none border border-neutral-200 object-contain"
                    : "mt-2 aspect-video h-auto w-full max-w-[420px] rounded-none border border-neutral-200 object-contain p-1"}
                />
              ) : null}
            </PracticeField>
          ))}
        </div>
      ) : null}

      <Divider orientation="left">Sorular</Divider>
      <div className="space-y-4">
        {questions.map((question, index) => (
          <PracticeField
            key={question.id || index}
            label={sectionCode === "TASK_3" ? "Tartışma konusu" : `Soru ${index + 1}`}
          >
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 5 }}
              value={question.questionText || ""}
              onChange={(event) => patchQuestion(question.id, event.target.value)}
            />
          </PracticeField>
        ))}
      </div>

      {sectionCode === "TASK_3" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {(["ADVANTAGE", "DISADVANTAGE"] as const).map((type) => {
            const points = asArray<any>(section.points).filter(
              (point) => point.type === type,
            );
            return (
              <Card
                key={type}
                size="small"
                title={type === "ADVANTAGE" ? "Lehine" : "Aleyhine"}
              >
                <div className="space-y-3">
                  {points.map((point, index) => (
                    <Input.TextArea
                      key={point.id || index}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      value={typeof point.example === "string" ? point.example : ""}
                      placeholder={`${index + 1}. görüş`}
                      onChange={(event) =>
                        patchPoint(type, index, event.target.value)
                      }
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function SpeakingPracticeEditor() {
  return (
    <PracticeContentEditorShell
      domainLabel="Konuşma"
      listPath="/speaking-practice"
      adminOne={speakingPracticeEndpoints.adminOne}
      contentEndpoint={speakingPracticeEndpoints.content}
      sectionLabel={(code) => sectionLabels[code] || code}
    >
      {({ practice, content, onChange }) => (
        <SpeakingPracticeFields
          sectionCode={practice.sectionCode}
          content={content}
          onChange={onChange}
        />
      )}
    </PracticeContentEditorShell>
  );
}
