import {
  Alert,
  Button,
  Input,
  InputNumber,
  Select,
  Tag,
  Typography,
} from "antd";
import { useEffect, useRef, useState, type ReactNode } from "react";
function FeedbackField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Typography.Text strong>{label}</Typography.Text>
      {children}
    </div>
  );
}
import {
  practiceFeedbackIssues,
  selectPracticeEvidence,
  type PracticeEvidence,
  type PracticeContent,
} from "./listening-practice-feedback-model";

const resolveAudioUrl = (value: string) =>
  /^(https?:|blob:|data:)/i.test(value)
    ? value
    : `${(import.meta.env.VITE_API_URL || "https://api.turkishmock.uz").replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;

export default function ListeningPracticeFeedbackEditor({
  content,
  onChange,
}: {
  content: PracticeContent;
  onChange: (content: PracticeContent) => void;
}) {
  const sections = content.parts?.[0]?.sections ?? [];
  const entries = sections
    .flatMap((section, sectionIndex) =>
      (section.questions ?? []).map((question, questionIndex) => ({
        section,
        sectionIndex,
        question,
        questionIndex,
      })),
    )
    .sort((a, b) => Number(a.question.number) - Number(b.question.number));
  const [selectedId, setSelectedId] = useState(entries[0]?.question.id ?? "");
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    source: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clipEnd = useRef<number | null>(null);
  const entry =
    entries.find((item) => item.question.id === selectedId) ?? entries[0];
  const question = entry?.question;
  const evidence: PracticeEvidence = question?.evidence ?? {};
  const transcript = String(entry?.section.transcript ?? "");
  const ready = content.audioUrl
    ? entries.filter(
        (item) =>
          practiceFeedbackIssues(
            item.section,
            item.question,
            content.audioDurationSeconds,
          ).length === 0,
      ).length
    : 0;
  const issues = question
    ? practiceFeedbackIssues(
        entry.section,
        question,
        content.audioDurationSeconds,
      )
    : [];

  useEffect(() => {
    setSelection(null);
    clipEnd.current = null;
    audioRef.current?.pause();
  }, [question?.id, content.audioUrl, transcript]);

  const patch = (patch: Partial<PracticeEvidence>) => {
    const next = structuredClone(content);
    next.parts[0].sections[entry.sectionIndex].questions[
      entry.questionIndex
    ].evidence = { ...evidence, ...patch };
    onChange(next);
  };
  const playClip = async () => {
    const audio = audioRef.current;
    if (
      !audio ||
      evidence.audioStartMs == null ||
      evidence.audioEndMs == null ||
      evidence.audioEndMs <= evidence.audioStartMs
    )
      return;
    audio.currentTime = evidence.audioStartMs / 1000;
    clipEnd.current = evidence.audioEndMs / 1000;
    try {
      await audio.play();
    } catch {
      clipEnd.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Çözüm sonrası inceleme
          </Typography.Title>
          <Typography.Text type="secondary">
            Cevabı gösteren cümleyi seçin, ses aralığını ve kısa gerekçeyi
            ekleyin.
          </Typography.Text>
        </div>
        <Tag
          color={
            ready === entries.length && entries.length ? "green" : "orange"
          }
        >
          {ready} / {entries.length} soru hazır
        </Tag>
      </div>
      {!content.audioUrl ? (
        <Alert
          showIcon
          type="warning"
          message="Önce İçerik sekmesinden ses dosyasını ekleyin."
        />
      ) : (
        <audio
          ref={audioRef}
          src={resolveAudioUrl(content.audioUrl)}
          controls
          preload="metadata"
          className="h-12 w-full"
          aria-label="Kanıt sesini dinle"
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration;
            if (
              !content.audioDurationSeconds &&
              Number.isFinite(duration) &&
              duration > 0
            ) {
              onChange({
                ...content,
                audioDurationSeconds: Math.ceil(duration),
              });
            }
          }}
          onPause={() => {
            clipEnd.current = null;
          }}
          onTimeUpdate={(event) => {
            if (
              clipEnd.current != null &&
              event.currentTarget.currentTime >= clipEnd.current
            ) {
              event.currentTarget.pause();
              clipEnd.current = null;
            }
          }}
        />
      )}
      {!entry ? (
        <Alert
          type="info"
          message="Önce İçerik sekmesinden soruları ekleyin."
        />
      ) : (
        <>
          <Select
            className="w-full"
            value={question.id}
            aria-label="İncelenecek soru"
            onChange={setSelectedId}
            options={entries.map((item, index) => ({
              value: item.question.id,
              label: `S${index + 1} · ${item.question.text || "İsimsiz soru"}${practiceFeedbackIssues(item.section, item.question, content.audioDurationSeconds).length ? " · Eksik" : " · Hazır"}`,
            }))}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="flex flex-col gap-3">
              <FeedbackField label="Transkript · cevap cümlesini seçin">
                <Input.TextArea
                  value={transcript}
                  readOnly
                  rows={16}
                  aria-label="Cevap kanıtı seçilecek transkript"
                  onSelect={(event) => {
                    const target = event.currentTarget;
                    setSelection({
                      start: target.selectionStart,
                      end: target.selectionEnd,
                      source: transcript,
                    });
                  }}
                  style={{ lineHeight: 1.8 }}
                />
              </FeedbackField>
              <Button
                disabled={
                  !selection ||
                  selection.source !== transcript ||
                  selection.end <= selection.start
                }
                onClick={() => {
                  if (selection && selection.source === transcript) {
                    patch(
                      selectPracticeEvidence(
                        transcript,
                        selection.start,
                        selection.end,
                        evidence,
                      ),
                    );
                    setSelection(null);
                  }
                }}
              >
                Seçili metni cevap kanıtı yap
              </Button>
              <p className="text-xs text-neutral-500">
                Transkript İçerik sekmesinde değiştirilirse cümle seçimleri ve
                ses aralıkları yeniden doğrulanmalıdır.
              </p>
            </section>
            <section className="flex flex-col gap-4">
              <div className="rounded-lg border border-neutral-200 p-4">
                <Typography.Text type="secondary">
                  Doğru cevap:{" "}
                </Typography.Text>
                <Typography.Text strong>
                  {(question.answers ?? [])
                    .filter((answer) => answer.correct)
                    .map((answer) => answer.variantText || answer.answer)
                    .join(", ") || "Seçilmedi"}
                </Typography.Text>
                <blockquote className="mt-3 whitespace-pre-wrap border-l-4 border-green-600 pl-3 text-neutral-800">
                  {evidence.evidenceText ||
                    "Soldaki transkriptten ilgili cümleyi seçin."}
                </blockquote>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["audioStartMs", "audioEndMs"] as const).map((key) => (
                  <FeedbackField
                    key={key}
                    label={
                      key === "audioStartMs"
                        ? "Başlangıç (saniye)"
                        : "Bitiş (saniye)"
                    }
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      aria-label={
                        key === "audioStartMs" ? "Ses başlangıcı" : "Ses bitişi"
                      }
                      min={0}
                      max={content.audioDurationSeconds || undefined}
                      step={0.1}
                      precision={3}
                      value={
                        evidence[key] == null ? null : evidence[key]! / 1000
                      }
                      onChange={(value) =>
                        patch({
                          [key]:
                            value == null
                              ? null
                              : Math.round(Number(value) * 1000),
                        })
                      }
                    />
                    <Button
                      type="link"
                      size="small"
                      disabled={!content.audioUrl}
                      onClick={() =>
                        patch({
                          [key]: Math.round(
                            (audioRef.current?.currentTime ?? 0) * 1000,
                          ),
                        })
                      }
                    >
                      Şu anı al
                    </Button>
                  </FeedbackField>
                ))}
              </div>
              <Button
                disabled={
                  evidence.audioStartMs == null ||
                  evidence.audioEndMs == null ||
                  evidence.audioEndMs <= evidence.audioStartMs ||
                  !content.audioUrl
                }
                onClick={() => void playClip()}
              >
                Seçilen aralığı dinle
              </Button>
              <FeedbackField label="Neden doğru?">
                <Input.TextArea
                  aria-label="Cevabın açıklaması"
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  value={evidence.explanation ?? ""}
                  placeholder="Cümledeki ipucunun doğru seçenekle ilişkisini kısaca açıklayın."
                  onChange={(event) =>
                    patch({ explanation: event.target.value })
                  }
                />
              </FeedbackField>
              {issues.length ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Tamamlanacak alanlar"
                  description={issues.join(" · ")}
                />
              ) : (
                <Alert
                  type="success"
                  showIcon
                  message="Bu sorunun öğrenci incelemesi hazır."
                />
              )}
              <Typography.Text type="secondary">
                Öğrenci önce numaralı cümleyi ve cevaplarını görür. Açıklama
                “Neden?” ile açılır.
              </Typography.Text>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
