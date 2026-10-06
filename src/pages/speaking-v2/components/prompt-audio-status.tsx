import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { RefreshCw, Trash2, Volume2 } from "lucide-react";

import { createBrowserMediaPreviewUrl } from "../speaking-v2-file.queries";

import type {
  SpeakingPromptStatus,
  SpeakingTaskCode,
  SpeakingV2AdminView,
  SpeakingV2PromptKey,
} from "../types";

const STATUS_COPY: Record<SpeakingPromptStatus, string> = {
  MISSING: "Hazır değil",
  GENERATING: "Hazırlanıyor",
  READY: "Hazır",
  STALE: "Güncel değil",
  FAILED: "Hata",
};

type PromptAudioItem = SpeakingV2AdminView["audioItems"][number];

function useAudioPreviewUrl(previewUrl: string | null) {
  const [audioUrl, setAudioUrl] = useState(previewUrl);

  useEffect(() => {
    setAudioUrl(previewUrl);
    if (!previewUrl || typeof fetch !== "function") return;

    const controller = new AbortController();
    let objectUrl: string | null = null;

    void createBrowserMediaPreviewUrl(previewUrl, controller.signal)
      .then((url) => {
        if (controller.signal.aborted) return;
        objectUrl = url;
        setAudioUrl(objectUrl);
      })
      .catch(() => {
        // Native media loading remains as a fallback outside the admin browser.
      });

    return () => {
      controller.abort();
      if (objectUrl && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [previewUrl]);

  return audioUrl;
}

const PROMPT_LABELS: Record<SpeakingV2PromptKey, string> = {
  TASK_1_1_INSTRUCTION: "Bölüm 1.1 · Anlatım",
  TASK_1_2_INSTRUCTION: "Bölüm 1.2 · Anlatım",
  TASK_2_INSTRUCTION: "Bölüm 2 · Anlatım",
  TASK_3_INSTRUCTION: "Bölüm 3 · Anlatım",
  TASK_1_1_Q1: "Bölüm 1.1 · Soru 1",
  TASK_1_1_Q2: "Bölüm 1.1 · Soru 2",
  TASK_1_1_Q3: "Bölüm 1.1 · Soru 3",
  TASK_1_2_Q1: "Bölüm 1.2 · Soru 1",
  TASK_1_2_Q2: "Bölüm 1.2 · Soru 2",
  TASK_1_2_Q3: "Bölüm 1.2 · Soru 3",
  TASK_2_PROMPT: "Bölüm 2 · Yönlendirici sorular",
  TASK_3_PROMPT: "Bölüm 3 · Tartışma sorusu",
};

export function PromptAudioStatus({
  item,
  disabled,
  pending,
  onRetry,
  onDelete,
}: {
  item: PromptAudioItem;
  disabled: boolean;
  pending: boolean;
  onRetry: (key: SpeakingV2PromptKey) => Promise<void>;
  onDelete: (key: SpeakingV2PromptKey) => Promise<void>;
}) {
  const canGenerate = item.status !== "GENERATING";
  const label = PROMPT_LABELS[item.key];
  const audioUrl = useAudioPreviewUrl(item.previewUrl);
  const optional =
    item.key.endsWith("_INSTRUCTION") ||
    item.taskCode === "TASK_2" ||
    item.taskCode === "TASK_3";

  return (
    <section className="prompt-audio-status" aria-label={label} aria-live="polite">
      <div className="prompt-audio-heading">
        <h4>{label}</h4>
        <span>
          {optional && "İsteğe bağlı · "}
          {pending ? "Hazırlanıyor" : STATUS_COPY[item.status]}
        </span>
      </div>
      <div className="prompt-audio-player">
        {audioUrl ? (
          <audio
            aria-label={`${label} ses önizlemesi`}
            controls
            preload="metadata"
            src={audioUrl}
          />
        ) : (
          <span className="prompt-audio-empty">Henüz ses oluşturulmadı</span>
        )}
        {item.error && <span className="field-error">{item.error}</span>}
      </div>
      {!disabled && (
        <div className="prompt-audio-actions">
          {canGenerate && (
            <Button
              icon={
                item.status === "MISSING" ? (
                  <Volume2 size={16} />
                ) : (
                  <RefreshCw size={16} />
                )
              }
              loading={pending}
              disabled={pending}
              onClick={() => void onRetry(item.key)}
            >
              {item.status === "MISSING"
                ? "Sesi hazırla"
                : "Sesi yeniden hazırla"}
            </Button>
          )}
          {item.audioObjectKey && (
            <Tooltip title="Sesi sil">
              <Button
                aria-label={`${label.replace(/ · .*/, "")} sesini sil`}
                disabled={pending}
                icon={<Trash2 size={16} />}
                onClick={() => void onDelete(item.key)}
              />
            </Tooltip>
          )}
        </div>
      )}
    </section>
  );
}

export function PromptAudioGroup({
  taskCode,
  items,
  disabled,
  pendingKeys,
  onRetry,
  onDelete,
}: {
  taskCode: SpeakingTaskCode;
  items: PromptAudioItem[];
  disabled: boolean;
  pendingKeys: ReadonlySet<SpeakingV2PromptKey>;
  onRetry: (key: SpeakingV2PromptKey) => Promise<void>;
  onDelete: (key: SpeakingV2PromptKey) => Promise<void>;
}) {
  return (
    <section
      className="prompt-audio-group"
      aria-labelledby={`${taskCode}-audio-title`}
    >
      <h3 id={`${taskCode}-audio-title`}>Sesler</h3>
      <div className="prompt-audio-list">
        {items.map((item) => (
          <PromptAudioStatus
            key={item.key}
            item={item}
            disabled={disabled}
            pending={pendingKeys.has(item.key)}
            onRetry={onRetry}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
