import { useRef, useState } from "react";
import { Alert, Button, Card, Input, InputNumber, Space, Typography } from "antd";
import {
  applyEvidenceSelection,
  evidenceMatchesSource,
  millisecondsToSeconds,
  secondsToMilliseconds,
} from "./mock-evidence-editor.helpers";
import type { MockEvidenceDraft } from "./mock-evidence-editor.helpers";

type EvidenceOption = {
  key: string;
  text: string;
  isCorrect: boolean;
};

interface MockEvidenceEditorProps {
  testType: "READING" | "LISTENING";
  sourceText: string;
  evidence?: MockEvidenceDraft | null;
  options?: EvidenceOption[];
  audioUrl?: string;
  onChange: (evidence: MockEvidenceDraft) => void;
}

const { Text } = Typography;

export default function MockEvidenceEditor({
  testType,
  sourceText,
  evidence,
  options = [],
  audioUrl,
  onChange,
}: MockEvidenceEditorProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const value = evidence || {};
  const hasEvidence = Boolean(value.evidenceText?.trim());
  const matches = evidenceMatchesSource(sourceText, value);

  const update = (patch: Partial<MockEvidenceDraft>) =>
    onChange({ ...value, ...patch });

  const useSelection = () => {
    if (selection.end <= selection.start) return;
    update(applyEvidenceSelection(sourceText, selection.start, selection.end));
  };

  const locateEvidence = () => {
    const text = value.evidenceText?.trim();
    if (!text) return;
    const start = sourceText.indexOf(text);
    if (start >= 0) {
      update({ textStart: start, textEnd: start + text.length });
    }
  };

  const playEvidence = async () => {
    const audio = audioRef.current;
    const startMs = Number(value.audioStartMs);
    const endMs = Number(value.audioEndMs);
    if (!audio || !Number.isFinite(startMs) || !Number.isFinite(endMs)) return;
    audio.currentTime = startMs / 1000;
    const stopAtEnd = () => {
      if (audio.currentTime * 1000 >= endMs) {
        audio.pause();
        audio.removeEventListener("timeupdate", stopAtEnd);
      }
    };
    audio.addEventListener("timeupdate", stopAtEnd);
    await audio.play();
  };

  return (
    <Card size="small" title="Kanıt ve açıklama" style={{ marginTop: 16 }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text strong>
            {testType === "LISTENING" ? "Transcript" : "Kaynak metin"}
          </Text>
          <Input.TextArea
            readOnly
            value={sourceText}
            rows={4}
            placeholder={
              testType === "LISTENING"
                ? "Önce bölüm transcriptini girin."
                : "Önce bölüm metnini girin."
            }
            onSelect={(event) => {
              const target = event.currentTarget;
              setSelection({
                start: target.selectionStart,
                end: target.selectionEnd,
              });
            }}
            style={{ marginTop: 8 }}
          />
          <Button
            size="small"
            onClick={useSelection}
            disabled={selection.end <= selection.start}
            style={{ marginTop: 8 }}
          >
            Seçili metni kanıt olarak kullan
          </Button>
        </div>

        <div>
          <Text strong>Kanıt alıntısı</Text>
          <Input.TextArea
            value={value.evidenceText || ""}
            onChange={(event) => update({ evidenceText: event.target.value })}
            autoSize={{ minRows: 2, maxRows: 5 }}
            placeholder="Doğru cevabı destekleyen gerçek alıntı"
            style={{ marginTop: 8 }}
          />
          <Space wrap style={{ marginTop: 8 }}>
            <Button size="small" onClick={locateEvidence} disabled={!hasEvidence}>
              Metinde bul
            </Button>
            <InputNumber
              min={0}
              precision={0}
              value={value.textStart}
              onChange={(next) => update({ textStart: next ?? undefined })}
              placeholder="Başlangıç"
            />
            <InputNumber
              min={0}
              precision={0}
              value={value.textEnd}
              onChange={(next) => update({ textEnd: next ?? undefined })}
              placeholder="Bitiş"
            />
          </Space>
        </div>

        {hasEvidence && (
          <Alert
            showIcon
            type={matches ? "success" : "error"}
            message={
              matches
                ? "Kanıt kaynak metinle eşleşiyor."
                : "Kanıt veya konumu kaynak metinle eşleşmiyor."
            }
          />
        )}

        <div>
          <Text strong>Neden doğru?</Text>
          <Input.TextArea
            value={value.explanation || ""}
            onChange={(event) => update({ explanation: event.target.value })}
            autoSize={{ minRows: 2, maxRows: 5 }}
            placeholder="Öğrencinin anlayacağı kısa açıklama"
            style={{ marginTop: 8 }}
          />
        </div>

        {testType === "LISTENING" && (
          <div>
            <Text strong>Ses kanıtı (saniye)</Text>
            <Space wrap style={{ display: "flex", marginTop: 8 }}>
              <InputNumber
                min={0}
                step={0.1}
                value={millisecondsToSeconds(value.audioStartMs)}
                onChange={(next) =>
                  update({ audioStartMs: secondsToMilliseconds(next) ?? undefined })
                }
                placeholder="Başlangıç"
              />
              <InputNumber
                min={0}
                step={0.1}
                value={millisecondsToSeconds(value.audioEndMs)}
                onChange={(next) =>
                  update({ audioEndMs: secondsToMilliseconds(next) ?? undefined })
                }
                placeholder="Bitiş"
              />
              {audioUrl && (
                <Button
                  onClick={() => void playEvidence()}
                  disabled={
                    value.audioStartMs == null ||
                    value.audioEndMs == null ||
                    value.audioEndMs <= value.audioStartMs
                  }
                >
                  Kanıtı dinle
                </Button>
              )}
            </Space>
            {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
          </div>
        )}

        {options.filter((option) => !option.isCorrect).length > 0 && (
          <div>
            <Text strong>Yanlış seçenek açıklamaları (isteğe bağlı)</Text>
            <Space direction="vertical" size="small" style={{ width: "100%", marginTop: 8 }}>
              {options
                .filter((option) => !option.isCorrect)
                .map((option) => (
                  <Input
                    key={option.key}
                    value={value.distractorExplanations?.[option.key] || ""}
                    onChange={(event) =>
                      update({
                        distractorExplanations: {
                          ...(value.distractorExplanations || {}),
                          [option.key]: event.target.value,
                        },
                      })
                    }
                    placeholder={`${option.key}. seçeneği neden yanlış?`}
                  />
                ))}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
}
