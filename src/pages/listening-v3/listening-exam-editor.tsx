import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
  Download,
  FileAudio,
  Highlighter,
  ImagePlus,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Save,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import toast from "react-hot-toast";
import {
  createFileAccessUrl,
  createFileDownloadUrl,
  useFileUpload,
} from "@/config/queries/file/upload.queries";
import ReadingEvidenceExplanationEditor from "@/pages/reading-v3/reading-evidence-explanation-editor";
import ListeningTranscriptEditor from "./listening-transcript-editor";
import type { ListeningTranscriptAlignmentSummary } from "@/config/queries/test/publication.queries";
import {
  getListeningDialogueLabel,
  getListeningEvidenceSpans,
  getListeningFixedQuestionPrompt,
  isListeningMapMatchingPart,
  isListeningQuestionPromptEditable,
  isSingleUseListeningPart,
  invalidateListeningEvidenceTiming,
  validateOfficialListeningDraft,
  withListeningEvidenceSpans,
  type ListeningEvidenceDraft,
  type ListeningEvidenceSpanDraft,
  type ListeningOptionDraft,
  type ListeningPartDraft,
  type ListeningQuestionDraft,
  type ListeningValidationIssue,
  type OfficialListeningDraft,
} from "./listening-editor-model";

type ListeningDraftOperation = (draft: OfficialListeningDraft) =>
  void | OfficialListeningDraft | Promise<void | OfficialListeningDraft>;

type ListeningExamEditorV3Props = {
  initialDraft: OfficialListeningDraft;
  onSave: ListeningDraftOperation;
  onRevise?: ListeningDraftOperation;
  requiresRevision?: boolean;
  onStateChange?: (state: { dirty: boolean; busy: boolean }) => void;
  onAutoAlign?: (
    draft: OfficialListeningDraft,
    onPersisted: (saved: OfficialListeningDraft) => void,
  ) => Promise<ListeningTranscriptAlignmentSummary & { savedDraft?: OfficialListeningDraft }>;
  onBack: () => void;
  onPublish?: (draft: OfficialListeningDraft) => void | Promise<void>;
  isSaving?: boolean;
  isAligning?: boolean;
  isPublishing?: boolean;
};

type PendingSelection = {
  text: string;
  start: number;
  end: number;
  popupLeft: number;
  popupTop: number;
};

const cloneDraft = (draft: OfficialListeningDraft) => structuredClone(draft);

const FILE_BASE = (
  import.meta.env.VITE_API_URL || "https://api.turkishmock.uz"
).replace(/\/+$/, "");

const resolveMediaUrl = (value: string) => {
  const mediaUrl = value.trim();
  if (!mediaUrl) return "";
  if (/^(https?:|blob:|data:)/i.test(mediaUrl)) return mediaUrl;
  return `${FILE_BASE}/${mediaUrl.replace(/^\/+/, "")}`;
};

const questionRanges: Record<number, string> = {
  1: "Sorular 1-8",
  2: "Sorular 9-14",
  3: "Sorular 15-18",
  4: "Sorular 19-23",
  5: "Sorular 24-29",
  6: "Sorular 30-35",
};

const transcriptPlaceholders: Record<number, string> = {
  1: "S1: Dinlemede duyulan ifade...\n\nS2: Dinlemede duyulan ifade...",
  2: "Dinleme metninin konuşulan içeriğini bir kez yazın.",
  3: "1. konuşmacı ...\n\n2. konuşmacı ...",
  4: "Harita veya rota anlatımında duyulan metni bir kez yazın.",
  5: "1. diyalog\n...\n\n2. diyalog\n...\n\n3. diyalog\n...",
  6: "Dinleme metninin konuşulan içeriğini bir kez yazın.",
};

const formatDuration = (seconds: number | null) => {
  if (!seconds || !Number.isFinite(seconds)) return "Süre okunmadı";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

const formatPlaybackTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

const formatElapsedTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

const getRequestErrorMessage = (error: unknown) => {
  const response = (
    error as {
      response?: {
        data?: {
          message?: string | string[];
          error?: string;
        };
      };
    }
  )?.response?.data;
  const message = Array.isArray(response?.message)
    ? response.message.join(" ")
    : response?.message;
  return String(message || response?.error || "").trim();
};

const secondsFromMs = (milliseconds: number | undefined) =>
  Number.isFinite(milliseconds) ? Number(milliseconds) / 1000 : 0;

const msFromSeconds = (seconds: number) =>
  Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds * 1000) : 0;

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
      {label}
    </span>
    {multiline ? (
      <textarea
        aria-label={label}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      />
    ) : (
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      />
    )}
  </label>
);

const transcriptLengthBefore = (
  container: HTMLElement,
  node: Node,
  offset: number,
) => {
  const prefix = document.createRange();
  prefix.selectNodeContents(container);
  prefix.setEnd(node, offset);
  const selectedContent = prefix.cloneContents();

  return Array.from(
    selectedContent.querySelectorAll<HTMLElement>(
      "[data-transcript-source-text]",
    ),
  ).reduce((length, element) => length + (element.textContent?.length ?? 0), 0);
};

const getSelectionOffsets = (container: HTMLElement, source: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed)
    return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const start = transcriptLengthBefore(
    container,
    range.startContainer,
    range.startOffset,
  );
  const end = transcriptLengthBefore(
    container,
    range.endContainer,
    range.endOffset,
  );
  const text = source.slice(start, end);
  const rect =
    typeof range.getBoundingClientRect === "function"
      ? range.getBoundingClientRect()
      : null;
  const popupWidth = 132;
  const popupHeight = 42;
  const centeredLeft = rect
    ? rect.left + rect.width / 2 - popupWidth / 2
    : 16;
  const popupLeft = Math.min(
    Math.max(8, centeredLeft),
    Math.max(8, window.innerWidth - popupWidth - 8),
  );
  const below = rect ? rect.bottom + 8 : 16;
  const popupTop =
    rect && below + popupHeight > window.innerHeight
      ? Math.max(8, rect.top - popupHeight - 8)
      : below;

  return end > start && text.trim()
    ? {
        text,
        start,
        end,
        popupLeft,
        popupTop,
      }
    : null;
};

const evidenceSegments = (
  source: string,
  questions: ListeningQuestionDraft[],
) => {
  const ranges = questions.flatMap((question) =>
    getListeningEvidenceSpans(question.evidence).flatMap((evidence) => {
      const valid =
        evidence.textStart >= 0 &&
        evidence.textEnd > evidence.textStart &&
        source.slice(evidence.textStart, evidence.textEnd) ===
          evidence.evidenceText;
      return valid ? [{ questionNumber: question.number, evidence }] : [];
    }),
  );
  const boundaries = Array.from(
    new Set([
      0,
      source.length,
      ...ranges.flatMap(({ evidence }) => [
        evidence.textStart,
        evidence.textEnd,
      ]),
    ]),
  ).sort((left, right) => left - right);

  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1];
    return {
      start,
      end,
      text: source.slice(start, end),
      questionNumbers: ranges
        .filter(
          ({ evidence }) =>
            evidence.textStart <= start && evidence.textEnd >= end,
        )
        .map(({ questionNumber }) => questionNumber),
    };
  });
};

const TranscriptEvidenceSelector = ({
  transcript,
  questions,
  activeQuestionNumber,
  onSelectQuestion,
  onEvidenceChange,
}: {
  transcript: string;
  questions: ListeningQuestionDraft[];
  activeQuestionNumber: number;
  onSelectQuestion: (questionNumber: number) => void;
  onEvidenceChange: (
    questionNumber: number,
    evidence: ListeningEvidenceDraft,
  ) => void;
}) => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const activeQuestion = questions.find(
    (question) => question.number === activeQuestionNumber,
  );
  const activeSpans = getListeningEvidenceSpans(activeQuestion?.evidence);
  const segments = evidenceSegments(transcript, questions);

  useEffect(() => {
    setPending(null);
    window.getSelection()?.removeAllRanges();
  }, [activeQuestionNumber, transcript]);

  if (!transcript.trim()) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-5 py-12 text-center text-sm text-neutral-500">
        Kanıt seçebilmek için önce bölüm transcriptini yazın.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-neutral-900">
          S{activeQuestionNumber} için transcript kanıtı
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          İlgili kelimeyi veya cümleyi seçin. Bir soru için birden fazla kanıt
          ekleyebilirsiniz.
        </p>
      </div>

      <div
        ref={transcriptRef}
        aria-label="Transcript üzerinden kanıt seç"
        onMouseUp={() => {
          if (transcriptRef.current) {
            setPending(getSelectionOffsets(transcriptRef.current, transcript));
          }
        }}
        onScroll={() => setPending(null)}
        className="min-h-[440px] max-h-[620px] select-text overflow-y-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-white px-5 py-4 text-[15px] leading-8 text-neutral-800"
      >
        {segments.map((segment) => {
          if (segment.questionNumbers.length === 0) {
            return (
              <span
                key={`${segment.start}-${segment.end}`}
                data-transcript-source-text
              >
                {segment.text}
              </span>
            );
          }
          const active = segment.questionNumbers.includes(activeQuestionNumber);
          const target = active
            ? activeQuestionNumber
            : segment.questionNumbers[0];
          const label = segment.questionNumbers
            .map((number) => `S${number}`)
            .join(", ");
          return (
            <button
              key={`${segment.start}-${segment.end}`}
              type="button"
              onClick={() => onSelectQuestion(target)}
              aria-label={`${label} kanıtı`}
              className={`inline rounded-sm px-0.5 text-left underline decoration-1 underline-offset-4 ${
                active
                  ? "bg-amber-200/80 text-neutral-950 decoration-amber-600"
                  : "bg-amber-100/70 text-neutral-900 decoration-amber-400"
              }`}
            >
              <span data-transcript-source-text>{segment.text}</span>
              <span
                aria-hidden="true"
                className={`ml-1 inline-flex rounded px-1 py-0.5 align-middle text-[10px] font-bold leading-none ${
                  active
                    ? "bg-amber-600 text-white"
                    : "bg-amber-200 text-amber-900"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {pending ? (
        <div
          role="toolbar"
          aria-label="Kanıt seçimi"
          style={{ left: pending.popupLeft, top: pending.popupTop }}
          className="fixed z-[1200] flex items-center gap-1 rounded-md border border-neutral-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            aria-label="Seçimi iptal et"
            onClick={() => {
              setPending(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const nextSpan: ListeningEvidenceSpanDraft = {
                evidenceText: pending.text,
                textStart: pending.start,
                textEnd: pending.end,
              };
              const validActiveSpans = activeSpans.filter(
                (span) =>
                  span.textStart >= 0 &&
                  span.textEnd > span.textStart &&
                  transcript.slice(span.textStart, span.textEnd) ===
                    span.evidenceText,
              );
              const exists = validActiveSpans.some(
                (span) =>
                  span.textStart === nextSpan.textStart &&
                  span.textEnd === nextSpan.textEnd,
              );
              if (!exists) {
                const nextEvidence = withListeningEvidenceSpans(
                  [...validActiveSpans, nextSpan],
                  activeQuestion?.evidence,
                );
                if (nextEvidence) {
                  onEvidenceChange(activeQuestionNumber, nextEvidence);
                }
              }
              setPending(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            <Highlighter className="h-3.5 w-3.5" />
            Vurgula
          </button>
        </div>
      ) : null}
    </div>
  );
};

const QuestionTabs = ({
  partNumber,
  questions,
  selectedNumber,
  issues,
  onSelect,
}: {
  partNumber: number;
  questions: ListeningQuestionDraft[];
  selectedNumber: number;
  issues: ListeningValidationIssue[];
  onSelect: (number: number) => void;
}) => {
  const groups =
    partNumber === 5
      ? [1, 2, 3].map((dialogueNumber) => ({
          label: `${dialogueNumber}. diyalog`,
          questions: questions.filter(
            (question) =>
              getListeningDialogueLabel(question.number) ===
              `${dialogueNumber}. diyalog`,
          ),
        }))
      : [{ label: null, questions }];

  const renderQuestionButton = (question: ListeningQuestionDraft) => {
    const hasIssue = issues.some(
      (item) => item.questionNumber === question.number,
    );
    return (
      <button
        key={question.number}
        type="button"
        onClick={() => onSelect(question.number)}
        className={`relative flex h-9 min-w-11 items-center justify-center rounded-md border px-3 text-xs font-bold transition ${
          selectedNumber === question.number
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
        }`}
      >
        S{question.number}
        {hasIssue ? (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" />
        ) : (
          <Check className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border border-white bg-emerald-600 p-0.5 text-white" />
        )}
      </button>
    );
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {groups.map((group) => (
        <div
          key={group.label ?? "questions"}
          className={
            group.label ? "min-w-max rounded-md bg-neutral-100 p-2" : ""
          }
        >
          {group.label ? (
            <p className="mb-1.5 px-1 text-[11px] font-semibold text-neutral-600">
              {group.label}
            </p>
          ) : null}
          <div className="flex gap-2">
            {group.questions.map(renderQuestionButton)}
          </div>
        </div>
      ))}
    </div>
  );
};

const OptionEditor = ({
  options,
  correctVariant,
  questionNumber,
  locked = false,
  singleUse = false,
  unavailableCorrectVariants = new Set<string>(),
  onChange,
  onCorrectChange,
}: {
  options: ListeningOptionDraft[];
  correctVariant: string;
  questionNumber: number;
  locked?: boolean;
  singleUse?: boolean;
  unavailableCorrectVariants?: Set<string>;
  onChange: (options: ListeningOptionDraft[]) => void;
  onCorrectChange: (variant: string) => void;
}) => (
  <div className="space-y-2">
    <div>
      <p className="text-xs font-semibold text-neutral-600">
        Cevap seçenekleri
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        {singleUse
          ? "Doğru seçeneği işaretleyin. Her seçenek bu bölümde yalnızca bir kez kullanılabilir."
          : "Doğru seçeneği aynı satırdan işaretleyin."}
      </p>
    </div>
    {options.map((option, index) => {
      const unavailable =
        unavailableCorrectVariants.has(option.variant) &&
        correctVariant !== option.variant;

      return (
        <div
          key={option.variant}
          className={`flex min-w-0 items-center gap-2 rounded-md border p-2 ${
            correctVariant === option.variant
              ? "border-emerald-300 bg-emerald-50"
              : "border-neutral-200 bg-white"
          }`}
        >
          <input
            type="radio"
            name={`listening-correct-${questionNumber}`}
            aria-label={`${option.variant} seçeneğini doğru cevap yap`}
            checked={correctVariant === option.variant}
            disabled={unavailable}
            title={
              unavailable
                ? "Bu seçenek başka bir soruda doğru cevap olarak kullanıldı."
                : undefined
            }
            onChange={() => onCorrectChange(option.variant)}
            className="h-4 w-4 shrink-0 accent-emerald-700 disabled:cursor-not-allowed disabled:opacity-35"
          />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-700">
            {option.variant}
          </span>
          <textarea
            aria-label={`${option.variant} seçeneği`}
            disabled={locked}
            value={option.text}
            onChange={(event) =>
              onChange(
                options.map((candidate, candidateIndex) =>
                  candidateIndex === index
                    ? { ...candidate, text: event.target.value }
                    : candidate,
                ),
              )
            }
            rows={2}
            className="min-h-12 min-w-0 flex-1 resize-y rounded-md border border-neutral-200 px-2.5 py-2 text-sm leading-5 text-neutral-900 outline-none disabled:bg-neutral-50 disabled:text-neutral-600 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            placeholder="Seçenek metni"
          />
        </div>
      );
    })}
  </div>
);

const MapLocationAnswerPicker = ({
  options,
  correctVariant,
  questionNumber,
  unavailableCorrectVariants,
  onCorrectChange,
}: {
  options: ListeningOptionDraft[];
  correctVariant: string;
  questionNumber: number;
  unavailableCorrectVariants: Set<string>;
  onCorrectChange: (variant: string) => void;
}) => (
  <fieldset>
    <legend className="text-xs font-semibold text-neutral-600">
      Haritadaki doğru konum
    </legend>
    <p className="mt-1 text-xs text-neutral-500">
      Doğru harfi seçin. Her harf bu bölümde yalnızca bir kez kullanılabilir.
    </p>
    <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8">
      {options.map((option) => {
        const unavailable =
          unavailableCorrectVariants.has(option.variant) &&
          correctVariant !== option.variant;
        const selected = correctVariant === option.variant;

        return (
          <label
            key={option.variant}
            className={`flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
              selected
                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                : unavailable
                  ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
            }`}
            title={
              unavailable
                ? "Bu harf başka bir sorunun doğru cevabı olarak kullanıldı."
                : `Doğru konum ${option.variant}`
            }
          >
            <input
              type="radio"
              name={`listening-correct-${questionNumber}`}
              aria-label={`${option.variant} harfini doğru konum yap`}
              checked={selected}
              disabled={unavailable}
              onChange={() => onCorrectChange(option.variant)}
              className="sr-only"
            />
            {option.variant}
          </label>
        );
      })}
    </div>
  </fieldset>
);

const AudioEvidenceEditor = ({
  audioRef,
  audioUrl,
  evidence,
  audioDurationSeconds,
  onChange,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  audioUrl: string;
  evidence?: ListeningEvidenceDraft;
  audioDurationSeconds: number | null;
  onChange: (evidence: ListeningEvidenceDraft) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [manualTimingOpen, setManualTimingOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const startSeconds = secondsFromMs(evidence?.audioStartMs);
  const endSeconds = secondsFromMs(evidence?.audioEndMs);
  const hasValidTiming = Boolean(
    evidence && evidence.audioEndMs > evidence.audioStartMs,
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncTime = () => setCurrentTime(audio.currentTime);
    const markPlaying = () => setIsAudioPlaying(true);
    const markPaused = () => setIsAudioPlaying(false);

    syncTime();
    setIsAudioPlaying(!audio.paused);
    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncTime);
    audio.addEventListener("play", markPlaying);
    audio.addEventListener("pause", markPaused);
    audio.addEventListener("ended", markPaused);

    return () => {
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncTime);
      audio.removeEventListener("play", markPlaying);
      audio.removeEventListener("pause", markPaused);
      audio.removeEventListener("ended", markPaused);
    };
  }, [audioRef, audioUrl]);

  const updateRange = (patch: Partial<ListeningEvidenceDraft>) => {
    if (!evidence) return;
    onChange({ ...evidence, ...patch });
  };

  const seekAudioBy = (offsetSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const maximumTime =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : (audioDurationSeconds ?? Number.POSITIVE_INFINITY);
    const nextTime = Math.min(
      Math.max(audio.currentTime + offsetSeconds, 0),
      maximumTime,
    );

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const playRange = async () => {
    const audio = audioRef.current;
    if (!audio || !evidence || evidence.audioEndMs <= evidence.audioStartMs)
      return;
    audio.currentTime = evidence.audioStartMs / 1000;
    setIsPlaying(true);
    const stop = () => {
      if (audio.currentTime * 1000 >= evidence.audioEndMs || audio.paused) {
        audio.pause();
        audio.removeEventListener("timeupdate", stop);
        setIsPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", stop);
    try {
      await audio.play();
    } catch {
      audio.removeEventListener("timeupdate", stop);
      setIsPlaying(false);
    }
  };

  const compactAudioPlayer = (
    <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <button
        type="button"
        aria-label="5 saniye geri"
        title="5 saniye geri"
        disabled={!audioUrl}
        onClick={() => seekAudioBy(-5)}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-neutral-700 shadow-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold tabular-nums">5</span>
      </button>
      <button
        type="button"
        aria-label={isAudioPlaying ? "Ana sesi durdur" : "Ana sesi oynat"}
        disabled={!audioUrl}
        onClick={async () => {
          const audio = audioRef.current;
          if (!audio) return;
          if (audio.paused) {
            try {
              await audio.play();
            } catch {
              setIsAudioPlaying(false);
            }
          } else {
            audio.pause();
          }
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAudioPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        aria-label="5 saniye ileri"
        title="5 saniye ileri"
        disabled={!audioUrl}
        onClick={() => seekAudioBy(5)}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-neutral-700 shadow-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCw className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold tabular-nums">5</span>
      </button>
      <input
        type="range"
        aria-label="Ana ses konumu"
        min={0}
        max={audioDurationSeconds ?? 0}
        step={0.1}
        value={Math.min(currentTime, audioDurationSeconds ?? currentTime)}
        disabled={!audioUrl || !audioDurationSeconds}
        onChange={(event) => {
          const nextTime = Number(event.target.value);
          const audio = audioRef.current;
          if (!audio || !Number.isFinite(nextTime)) return;
          audio.currentTime = nextTime;
          setCurrentTime(nextTime);
        }}
        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="shrink-0 tabular-nums text-xs font-semibold text-neutral-600">
        {formatPlaybackTime(currentTime)} /{" "}
        {formatDuration(audioDurationSeconds)}
      </span>
    </div>
  );

  if (!evidence) {
    return (
      <div className="space-y-3">
        {compactAudioPlayer}
        <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
          Önce transcript üzerinden kanıt seçin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {compactAudioPlayer}
      <div className="rounded-md border border-neutral-200 bg-white">
        <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-800">
                Ses zamanı
              </p>
              <p className="mt-0.5 text-xs leading-5 text-neutral-500">
                {hasValidTiming
                  ? `Hazır · ${formatPlaybackTime(startSeconds)}–${formatPlaybackTime(endSeconds)}`
                  : 'Üstteki “Otomatik eşleştir” ile hazırlanır.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasValidTiming ? (
              <button
                type="button"
                onClick={() => {
                  if (isPlaying) {
                    audioRef.current?.pause();
                    setIsPlaying(false);
                  } else {
                    void playRange();
                  }
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {isPlaying ? "Durdur" : "Aralığı dinle"}
              </button>
            ) : null}
            <button
              type="button"
              aria-expanded={manualTimingOpen}
              onClick={() => setManualTimingOpen((current) => !current)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Zamanı elle düzelt
              {manualTimingOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {manualTimingOpen ? (
          <div className="border-t border-neutral-200 bg-neutral-50/70 px-3 py-3">
            <p className="mb-3 text-xs leading-5 text-neutral-500">
              Yalnızca otomatik eşleştirme yanlış yeri bulduysa düzeltin.
              Ana sesi oynatıp başlangıç ve bitiş anını alın.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="rounded-md border border-neutral-200 bg-white p-3">
                <span className="text-[11px] font-semibold uppercase text-neutral-500">
                  1. Başlangıç
                </span>
                <div className="mt-2 grid gap-2">
                  <input
                    aria-label="Ses kanıtı başlangıç saniyesi"
                    type="number"
                    min={0}
                    step={0.1}
                    value={startSeconds}
                    onChange={(event) =>
                      updateRange({
                        audioStartMs: msFromSeconds(Number(event.target.value)),
                      })
                    }
                    className="h-9 w-full min-w-0 rounded-md border border-neutral-200 px-2 text-sm outline-none focus:border-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateRange({
                        audioStartMs: msFromSeconds(
                          audioRef.current?.currentTime ?? startSeconds,
                        ),
                      })
                    }
                    className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Başlangıcı al
                  </button>
                </div>
              </label>
              <label className="rounded-md border border-neutral-200 bg-white p-3">
                <span className="text-[11px] font-semibold uppercase text-neutral-500">
                  2. Bitiş
                </span>
                <div className="mt-2 grid gap-2">
                  <input
                    aria-label="Ses kanıtı bitiş saniyesi"
                    type="number"
                    min={0}
                    max={audioDurationSeconds ?? undefined}
                    step={0.1}
                    value={endSeconds}
                    onChange={(event) =>
                      updateRange({
                        audioEndMs: msFromSeconds(Number(event.target.value)),
                      })
                    }
                    className="h-9 w-full min-w-0 rounded-md border border-neutral-200 px-2 text-sm outline-none focus:border-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateRange({
                        audioEndMs: msFromSeconds(
                          audioRef.current?.currentTime ?? endSeconds,
                        ),
                      })
                    }
                    className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Bitişi al
                  </button>
                </div>
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const EvidenceDetails = ({
  part,
  question,
  audioRef,
  audioUrl,
  audioDurationSeconds,
  onChange,
}: {
  part: ListeningPartDraft;
  question: ListeningQuestionDraft;
  audioRef: RefObject<HTMLAudioElement | null>;
  audioUrl: string;
  audioDurationSeconds: number | null;
  onChange: (evidence: ListeningEvidenceDraft | undefined) => void;
}) => {
  const evidence = question.evidence ?? ([1, 5].includes(part.number) ? {
    evidenceText: "",
    textStart: 0,
    textEnd: 0,
    evidenceSpans: [],
    explanation: "",
    audioStartMs: 0,
    audioEndMs: 0,
  } : undefined);
  const spans = getListeningEvidenceSpans(evidence);

  return (
    <div className="space-y-4">
      {spans.length > 0 ? (
        <div className="space-y-2">
          {spans.map((span, index) => {
            const valid =
              span.textStart >= 0 &&
              span.textEnd > span.textStart &&
              part.transcript.slice(span.textStart, span.textEnd) ===
                span.evidenceText;
            return (
              <div
                key={`${span.textStart}-${span.textEnd}-${index}`}
                className={`rounded-md border px-3 py-3 ${
                  valid
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase text-neutral-500">
                      Transcript kanıtı
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-800">
                      “{span.evidenceText}”
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        withListeningEvidenceSpans(
                          spans.filter((_, spanIndex) => spanIndex !== index),
                          evidence,
                        ),
                      )
                    }
                    className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Kaldır
                  </button>
                </div>
                {!valid ? (
                  <p className="mt-2 text-xs font-medium text-red-700">
                    Transcript değişti. Bu kanıtı yeniden seçin.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <AudioEvidenceEditor
        key={question.number}
        audioRef={audioRef}
        audioUrl={audioUrl}
        evidence={evidence}
        audioDurationSeconds={audioDurationSeconds}
        onChange={(next) => onChange(next)}
      />

      {evidence ? (
        <ReadingEvidenceExplanationEditor
          value={evidence.explanation}
          onChange={(explanation) => onChange({ ...evidence, explanation })}
          rows={4}
        />
      ) : null}
    </div>
  );
};

const issueCountByPart = (issues: ListeningValidationIssue[]) => {
  const result = new Map<number, number>();
  issues.forEach((item) =>
    result.set(item.partNumber, (result.get(item.partNumber) ?? 0) + 1),
  );
  return result;
};

const mediaDuration = (file: File) =>
  new Promise<number>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      URL.revokeObjectURL(objectUrl);
      if (Number.isFinite(duration) && duration > 0) {
        resolve(duration);
        return;
      }
      reject(new Error("Ses süresi okunamadı."));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Ses dosyası okunamadı."));
    };
    audio.src = objectUrl;
  });

export function ListeningExamEditorV3({
  initialDraft,
  onSave,
  onAutoAlign,
  onRevise,
  requiresRevision = false,
  onStateChange,
  onBack,
  onPublish,
  isSaving = false,
  isAligning = false,
  isPublishing = false,
}: ListeningExamEditorV3Props) {
  const [draft, setDraft] = useState(() => cloneDraft(initialDraft));
  const [activePartNumber, setActivePartNumber] = useState(1);
  const [selectedQuestionByPart, setSelectedQuestionByPart] = useState<
    Record<number, number>
  >(
    Object.fromEntries(
      initialDraft.parts.map((part) => [part.number, part.questions[0].number]),
    ),
  );
  const [transcriptMode, setTranscriptMode] = useState<"edit" | "evidence">(
    "edit",
  );
  const [dirty, setDirty] = useState(false);
  const operationInFlight = useRef(false);
  const [operationPending, setOperationPending] = useState(false);
  const hydratedKey = useRef(initialDraft.testId || initialDraft.ieltsId);
  const mustRevise = requiresRevision || draft.status === "PUBLISHED" || Boolean(draft.publishedAt);
  const [showValidation, setShowValidation] = useState(false);
  const [audioPlaybackError, setAudioPlaybackError] = useState("");
  const [uploadedAudioPreviewUrl, setUploadedAudioPreviewUrl] = useState("");
  const [refreshedAudioAccessUrl, setRefreshedAudioAccessUrl] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState("");
  const [uploadedImagePreviewUrl, setUploadedImagePreviewUrl] = useState("");
  const [refreshedImageAccessUrl, setRefreshedImageAccessUrl] = useState("");
  const [downloadingMedia, setDownloadingMedia] = useState<
    "audio" | "image" | null
  >(null);
  const [alignmentSummary, setAlignmentSummary] =
    useState<ListeningTranscriptAlignmentSummary | null>(null);
  const [alignmentPhase, setAlignmentPhase] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [alignmentElapsedSeconds, setAlignmentElapsedSeconds] = useState(0);
  const [alignmentError, setAlignmentError] = useState("");
  const [playingAlignmentPart, setPlayingAlignmentPart] = useState<
    number | null
  >(null);
  const audioRefreshAttemptRef = useRef("");
  const imageRefreshAttemptRef = useRef("");
  const alignmentStartedAtRef = useRef(0);
  const alignmentPreviewRangeRef = useRef<{
    partNumber: number;
    startMs: number;
    endMs: number;
  } | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileUpload = useFileUpload();
  const busy = operationPending || fileUpload.isPending || isSaving || isAligning || isPublishing;

  useEffect(() => {
    const key = initialDraft.testId || initialDraft.ieltsId;
    if (hydratedKey.current === key) return;
    hydratedKey.current = key;
    setDraft(cloneDraft(initialDraft));
    setDirty(false);
    setAlignmentSummary(null);
    setAlignmentPhase("idle");
    setAlignmentElapsedSeconds(0);
    setAlignmentError("");
    setPlayingAlignmentPart(null);
    alignmentPreviewRangeRef.current = null;
  }, [initialDraft]);

  useEffect(() => {
    onStateChange?.({ dirty, busy });
  }, [dirty, busy, onStateChange]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty && !busy && !operationInFlight.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty, busy]);

  const adoptSavedDraft = (saved: OfficialListeningDraft) => {
    hydratedKey.current = saved.testId || saved.ieltsId;
    setDraft(cloneDraft(saved));
    setDirty(false);
  };

  const runOperation = async (operation: ListeningDraftOperation) => {
    if (busy || operationInFlight.current) return;
    operationInFlight.current = true;
    setOperationPending(true);
    try {
      const saved = await operation(draft);
      if (saved) adoptSavedDraft(saved);
      else setDirty(false);
    } catch {
      // Mutation hooks report failure. Keep unsaved content for the next attempt.
    } finally {
      operationInFlight.current = false;
      setOperationPending(false);
    }
  };

  const validation = useMemo(
    () => validateOfficialListeningDraft(draft),
    [draft],
  );
  const issuesByPart = useMemo(
    () => issueCountByPart(validation.issues),
    [validation.issues],
  );
  const activePart =
    draft.parts.find((part) => part.number === activePartNumber) ??
    draft.parts[0];
  const selectedQuestionNumber =
    selectedQuestionByPart[activePart.number] ?? activePart.questions[0].number;
  const selectedQuestion =
    activePart.questions.find(
      (question) => question.number === selectedQuestionNumber,
    ) ?? activePart.questions[0];
  const activePartIssues = validation.issues.filter(
    (item) => item.partNumber === activePart.number,
  );
  const displayedOptions =
    activePart.optionBank.length > 0
      ? activePart.optionBank
      : selectedQuestion.options;
  const singleUseOptions = isSingleUseListeningPart(activePart.number);
  const unavailableCorrectVariants = new Set(
    singleUseOptions
      ? activePart.questions
          .filter((question) => question.number !== selectedQuestion.number)
          .map((question) => question.correctVariant)
          .filter(Boolean)
      : [],
  );
  const fixedQuestionPrompt = getListeningFixedQuestionPrompt(
    activePart.number,
    selectedQuestion.number,
  );
  const questionPromptIsEditable = isListeningQuestionPromptEditable(
    activePart.number,
  );
  const playableAudioUrl =
    uploadedAudioPreviewUrl ||
    refreshedAudioAccessUrl ||
    resolveMediaUrl(draft.audioUrl);
  const playableImageUrl =
    uploadedImagePreviewUrl ||
    refreshedImageAccessUrl ||
    resolveMediaUrl(activePart.imageUrl);
  const canAutoAlign =
    Boolean(draft.audioUrl.trim()) &&
    draft.parts.every((part) => part.transcript.trim().length > 0);
  const alignmentIsRunning = alignmentPhase === "running" || isAligning;

  useEffect(() => {
    setAudioPlaybackError("");
  }, [playableAudioUrl]);

  useEffect(() => {
    audioRefreshAttemptRef.current = "";
    setRefreshedAudioAccessUrl("");
  }, [draft.audioUrl]);

  useEffect(() => {
    imageRefreshAttemptRef.current = "";
    setRefreshedImageAccessUrl("");
    setImagePreviewError("");
  }, [activePart.imageUrl]);

  useEffect(
    () => () => {
      if (uploadedAudioPreviewUrl) {
        URL.revokeObjectURL(uploadedAudioPreviewUrl);
      }
    },
    [uploadedAudioPreviewUrl],
  );

  useEffect(
    () => () => {
      if (uploadedImagePreviewUrl) {
        URL.revokeObjectURL(uploadedImagePreviewUrl);
      }
    },
    [uploadedImagePreviewUrl],
  );

  useEffect(() => {
    if (alignmentPhase !== "running") return;
    const updateElapsed = () => {
      setAlignmentElapsedSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - alignmentStartedAtRef.current) / 1000),
        ),
      );
    };
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [alignmentPhase]);

  const updateDraft = (next: OfficialListeningDraft) => {
    if (busy || mustRevise || operationInFlight.current) return;
    const alignmentSourceChanged =
      next.audioUrl !== draft.audioUrl ||
      next.parts.some(
        (part, index) =>
          part.transcript !== (draft.parts[index]?.transcript ?? ""),
      );
    if (alignmentSourceChanged) {
      setAlignmentSummary(null);
      setAlignmentPhase("idle");
      setAlignmentElapsedSeconds(0);
      setAlignmentError("");
      setPlayingAlignmentPart(null);
      alignmentPreviewRangeRef.current = null;
    }
    setDraft(invalidateListeningEvidenceTiming(draft, next));
    setDirty(true);
  };

  const updatePart = (nextPart: ListeningPartDraft) => {
    updateDraft({
      ...draft,
      parts: draft.parts.map((part) =>
        part.number === nextPart.number ? nextPart : part,
      ),
    });
  };

  const updateQuestion = (nextQuestion: ListeningQuestionDraft) => {
    updatePart({
      ...activePart,
      questions: activePart.questions.map((question) =>
        question.number === nextQuestion.number ? nextQuestion : question,
      ),
    });
  };

  const selectQuestion = (questionNumber: number) => {
    setSelectedQuestionByPart((current) => ({
      ...current,
      [activePart.number]: questionNumber,
    }));
  };

  const goToIssue = (item: ListeningValidationIssue) => {
    setActivePartNumber(item.partNumber);
    if (item.questionNumber) {
      setSelectedQuestionByPart((current) => ({
        ...current,
        [item.partNumber]: item.questionNumber as number,
      }));
    }
    if (item.field === "evidence") setTranscriptMode("evidence");
    setShowValidation(false);
  };

  const runMediaOperation = async (operation: () => Promise<void>) => {
    if (busy || mustRevise || operationInFlight.current) return;
    // Take the same lock as save/publish before even probing local audio metadata.
    operationInFlight.current = true;
    setOperationPending(true);
    try {
      await operation();
    } catch {
      // Upload mutation reports network errors; keep the original draft intact.
    } finally {
      operationInFlight.current = false;
      setOperationPending(false);
    }
  };

  const handleAudioUpload = (file: File) => runMediaOperation(async () => {
    const sourceKey = hydratedKey.current;
    let duration: number;
    try {
      duration = await mediaDuration(file);
    } catch {
      toast.error("Ses dosyası okunamadı");
      return;
    }
    if (hydratedKey.current !== sourceKey) return;
    const uploadResponse = await fileUpload.mutateAsync(file);
    const storedAudioReference = uploadResponse.data.reference || uploadResponse.data.url;
    if (!storedAudioReference) throw new Error("Yüklenen ses için medya referansı alınamadı.");
    if (hydratedKey.current !== sourceKey) return;
    audioRefreshAttemptRef.current = "";
    setRefreshedAudioAccessUrl("");
    setUploadedAudioPreviewUrl(URL.createObjectURL(file));
    setAudioPlaybackError("");
    setAlignmentSummary(null);
    setAlignmentPhase("idle");
    setAlignmentElapsedSeconds(0);
    setAlignmentError("");
    setPlayingAlignmentPart(null);
    alignmentPreviewRangeRef.current = null;
    setDraft((current) => invalidateListeningEvidenceTiming(current, {
      ...current,
      audioUrl: storedAudioReference,
      audioDurationSeconds: duration,
    }));
    setDirty(true);
  });

  const handleAudioPlaybackError = async () => {
    const source = String(draft.audioUrl || "").trim();
    if (!source) {
      setAudioPlaybackError("Ses önizlemesi açılamadı.");
      return;
    }

    if (audioRefreshAttemptRef.current === source) {
      setAudioPlaybackError(
        "Ses önizlemesi açılamadı. Sayfayı yenileyip tekrar deneyin.",
      );
      return;
    }

    audioRefreshAttemptRef.current = source;
    try {
      const freshUrl = await createFileAccessUrl(source);
      if (!freshUrl || freshUrl === playableAudioUrl) {
        throw new Error("Yeni medya bağlantısı alınamadı.");
      }
      setAudioPlaybackError("");
      setRefreshedAudioAccessUrl(freshUrl);
    } catch {
      setAudioPlaybackError(
        "Ses önizlemesi yenilenemedi. Sayfayı yenileyip tekrar deneyin.",
      );
    }
  };

  const handleImageUpload = (file: File) => runMediaOperation(async () => {
    const sourceKey = hydratedKey.current;
    const partNumber = activePart.number;
    const uploadResponse = await fileUpload.mutateAsync(file);
    const storedImageReference = uploadResponse.data.reference || uploadResponse.data.url;
    if (!storedImageReference) throw new Error("Yüklenen görsel için medya referansı alınamadı.");
    if (hydratedKey.current !== sourceKey) return;
    imageRefreshAttemptRef.current = "";
    setRefreshedImageAccessUrl("");
    setUploadedImagePreviewUrl(URL.createObjectURL(file));
    setImagePreviewError("");
    // Merge only this media field, never an earlier whole draft or revision.
    setDraft((current) => ({
      ...current,
      parts: current.parts.map((part) => part.number === partNumber
        ? { ...part, imageUrl: storedImageReference }
        : part),
    }));
    setDirty(true);
  });

  const handleImagePreviewError = async () => {
    if (uploadedImagePreviewUrl) {
      setUploadedImagePreviewUrl("");
      return;
    }

    const source = String(activePart.imageUrl || "").trim();
    if (!source) {
      setImagePreviewError("Görsel önizlemesi açılamadı.");
      return;
    }

    if (imageRefreshAttemptRef.current === source) {
      setImagePreviewError(
        "Görsel önizlemesi açılamadı. Sayfayı yenileyip tekrar deneyin.",
      );
      return;
    }

    imageRefreshAttemptRef.current = source;
    try {
      const freshUrl = await createFileAccessUrl(source);
      if (!freshUrl || freshUrl === playableImageUrl) {
        throw new Error("Yeni medya bağlantısı alınamadı.");
      }
      setImagePreviewError("");
      setRefreshedImageAccessUrl(freshUrl);
    } catch {
      setImagePreviewError(
        "Görsel önizlemesi yenilenemedi. Sayfayı yenileyip tekrar deneyin.",
      );
    }
  };

  const handleMediaDownload = async (
    reference: string,
    kind: "audio" | "image",
  ) => {
    if (!reference.trim() || downloadingMedia) return;
    setDownloadingMedia(kind);
    try {
      const downloadUrl = await createFileDownloadUrl(reference);
      if (!downloadUrl) throw new Error("İndirme bağlantısı alınamadı.");
      const anchor = document.createElement("a");
      anchor.href = resolveMediaUrl(downloadUrl);
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      toast.success(kind === "audio" ? "Ses indiriliyor" : "Görsel indiriliyor");
    } catch {
      toast.error(
        kind === "audio"
          ? "Ses indirme bağlantısı alınamadı"
          : "Görsel indirme bağlantısı alınamadı",
      );
    } finally {
      setDownloadingMedia(null);
    }
  };

  const stopAlignmentPreview = () => {
    alignmentPreviewRangeRef.current = null;
    setPlayingAlignmentPart(null);
  };

  const handleAlignmentPreview = async (
    section: ListeningTranscriptAlignmentSummary["sections"][number],
  ) => {
    const segment = section.reviewSegment;
    const audio = audioRef.current;
    if (!audio || !segment) return;

    if (
      playingAlignmentPart === section.partNumber &&
      !audio.paused
    ) {
      audio.pause();
      stopAlignmentPreview();
      return;
    }

    audio.pause();
    audio.currentTime = Math.max(0, segment.audioStartMs / 1000);
    alignmentPreviewRangeRef.current = {
      partNumber: section.partNumber,
      startMs: segment.audioStartMs,
      endMs: Math.max(segment.audioStartMs + 250, segment.audioEndMs),
    };
    setPlayingAlignmentPart(section.partNumber);
    try {
      await audio.play();
    } catch {
      stopAlignmentPreview();
      toast.error("Kontrol cümlesi oynatılamadı");
    }
  };

  const handleAlignmentAudioTimeUpdate = (
    audio: HTMLAudioElement,
  ) => {
    const range = alignmentPreviewRangeRef.current;
    if (!range) return;
    if (audio.currentTime * 1000 >= range.endMs) {
      audio.pause();
      stopAlignmentPreview();
    }
  };

  const handleAutoAlign = async () => {
    if (!onAutoAlign || !canAutoAlign || busy || mustRevise || operationInFlight.current) return;
    operationInFlight.current = true;
    setOperationPending(true);
    alignmentStartedAtRef.current = Date.now();
    setAlignmentElapsedSeconds(0);
    setAlignmentSummary(null);
    setAlignmentError("");
    setAlignmentPhase("running");
    stopAlignmentPreview();
    try {
      const result = await onAutoAlign(draft, adoptSavedDraft);
      if (result.savedDraft) adoptSavedDraft(result.savedDraft);
      setAlignmentElapsedSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - alignmentStartedAtRef.current) / 1000),
        ),
      );
      setAlignmentSummary(result);
      setAlignmentPhase("success");
      setDirty(false);
      const allMatched =
        result.alignedSentences === result.totalSentences &&
        result.alignedEvidence === result.totalEvidence;
      const progress = `${result.alignedSentences}/${result.totalSentences} cümle${
        result.totalEvidence > 0
          ? ` ve ${result.alignedEvidence}/${result.totalEvidence} kanıt`
          : ""
      } eşleştirildi`;
      toast.success(
        result.cached
          ? allMatched
            ? "Cümle ve kanıt zamanları zaten hazır"
            : progress
          : allMatched
            ? "Cümle ve kanıt zamanları oluşturuldu"
            : progress,
      );
    } catch (error) {
      setAlignmentElapsedSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - alignmentStartedAtRef.current) / 1000),
        ),
      );
      setAlignmentError(
        getRequestErrorMessage(error) ||
          "Ses ve transcript eşleştirilemedi. Taslağınız korunuyor; yeniden deneyebilirsiniz.",
      );
      setAlignmentPhase("error");
    } finally {
      operationInFlight.current = false;
      setOperationPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-900">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              aria-label="Dinleme testlerine dön"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold">
                  Dinleme testi
                </h1>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                  V3
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {dirty
                  ? "Kaydedilmemiş değişiklikler var"
                  : initialDraft.testId
                    ? "Değişiklikler kaydedildi"
                    : "Yeni taslak"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowValidation(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <CircleAlert className="h-4 w-4" />
              Yayın kontrolü
            </button>
            <button
              type="button"
              disabled={busy || mustRevise}
              onClick={() => void runOperation(onSave)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Kaydediliyor" : "Taslağı kaydet"}
            </button>
            {mustRevise && onRevise ? (
              <button type="button" disabled={busy} onClick={() => void runOperation(onRevise)} className="inline-flex h-9 items-center rounded-md border border-neutral-300 bg-white px-4 text-xs font-semibold disabled:opacity-50">
                Yeni sürüm oluştur
              </button>
            ) : null}
          </div>
        </div>
        {mustRevise ? <p className="mx-auto max-w-[1600px] px-4 pb-3 text-xs text-neutral-600 lg:px-6">Yayımlanmış veya başlanmış test korunur. Düzenlemek için yeni bir taslak sürüm oluşturun.</p> : null}
      </header>

      <fieldset disabled={busy || mustRevise} className="min-w-0 border-0 p-0" aria-busy={busy}>
      <main inert={busy || mustRevise} className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
        <section className="space-y-4 border-b border-neutral-200 pb-5">
          <div className="space-y-3">
            <TextField
              label="Test adı"
              value={draft.title}
              onChange={(title) => updateDraft({ ...draft, title })}
              placeholder="Örn. Millî sertifika dinleme denemesi 1"
            />
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="font-semibold">
                {validation.completedQuestions}/35 soru hazır
              </span>
              <span aria-hidden="true">·</span>
              <span>6 bölüm</span>
            </div>
          </div>

          <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                  <FileAudio className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    Tek ana ses
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Uygulama bu dosyayı bir kez oynatır. Tekrarlar gerekiyorsa
                    ses dosyasının içinde hazır olmalıdır.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {draft.audioUrl ? (
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-100 px-3 text-xs font-semibold text-neutral-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDuration(draft.audioDurationSeconds)}
                  </span>
                ) : null}
                {draft.audioUrl ? (
                  <button
                    type="button"
                    aria-label="Ana sesi indir"
                    title="Ana sesi indir"
                    disabled={downloadingMedia !== null}
                    onClick={() =>
                      void handleMediaDownload(draft.audioUrl, "audio")
                    }
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {downloadingMedia === "audio" ? "Hazırlanıyor" : "İndir"}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={fileUpload.isPending}
                  onClick={() => audioInputRef.current?.click()}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {draft.audioUrl ? "Sesi değiştir" : "Ses yükle"}
                </button>
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleAudioUpload(file);
                  event.target.value = "";
                }}
              />
            </div>
            {draft.audioUrl ? (
              <div className="mt-4 space-y-2">
                <audio
                  key={playableAudioUrl}
                  ref={audioRef}
                  src={playableAudioUrl}
                  controls
                  preload="metadata"
                  onCanPlay={() => setAudioPlaybackError("")}
                  onError={() => void handleAudioPlaybackError()}
                  onTimeUpdate={(event) =>
                    handleAlignmentAudioTimeUpdate(event.currentTarget)
                  }
                  onEnded={stopAlignmentPreview}
                  onLoadedMetadata={(event) => {
                    setAudioPlaybackError("");
                    const duration = event.currentTarget.duration;
                    if (
                      Number.isFinite(duration) &&
                      duration > 0 &&
                      Math.round(Number(draft.audioDurationSeconds ?? 0)) !==
                        Math.round(duration)
                    ) {
                      updateDraft({
                        ...draft,
                        audioDurationSeconds: duration,
                      });
                    }
                  }}
                  className="h-10 w-full"
                />
                {audioPlaybackError ? (
                  <p className="text-xs font-medium text-red-600">
                    {audioPlaybackError}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm text-neutral-500">
                MP3, M4A veya tarayıcının oynatabildiği başka bir ses dosyası
                yükleyin.
              </div>
            )}
            {onAutoAlign ? (
              <div className="mt-4 border-t border-neutral-200 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      Cümle oynatma zamanları
                    </p>
                    <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
                      Ses dosyasını transcriptle karşılaştırır ve her cümlenin
                      ses içindeki başlangıç ve bitiş noktasını bulur.
                      Genellikle ses uzunluğuna göre 1-5 dakika sürer.
                    </p>
                    {!canAutoAlign ? (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Ana sesi ve altı bölümün transcriptini tamamlayın.
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={
                      !canAutoAlign || alignmentIsRunning || isSaving
                    }
                    onClick={() => void handleAutoAlign()}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {alignmentIsRunning ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <WandSparkles className="h-4 w-4" />
                    )}
                    {alignmentIsRunning
                      ? "Eşleştiriliyor"
                      : alignmentSummary
                        ? "Yeniden eşleştir"
                        : "Otomatik eşleştir"}
                  </button>
                </div>

                {alignmentIsRunning ? (
                  <div
                    role="status"
                    className="mt-4 flex items-start gap-3 border-t border-neutral-100 pt-4"
                  >
                    <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-neutral-700" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">
                        Ses ve transcript analiz ediliyor ·{" "}
                        {formatElapsedTime(alignmentElapsedSeconds)}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        İşlem tamamlanana kadar bu sayfayı kapatmayın. Sonuç
                        burada otomatik görünecek.
                      </p>
                    </div>
                  </div>
                ) : null}

                {alignmentPhase === "error" ? (
                  <div
                    role="alert"
                    className="mt-4 border-t border-red-100 pt-4"
                  >
                    <p className="text-xs font-semibold text-red-700">
                      Eşleştirme tamamlanamadı ·{" "}
                      {formatElapsedTime(alignmentElapsedSeconds)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-red-600">
                      {alignmentError}
                    </p>
                  </div>
                ) : null}

                {alignmentSummary ? (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold text-emerald-700">
                        {alignmentSummary.alignedSentences}/
                        {alignmentSummary.totalSentences} cümle
                        {alignmentSummary.totalEvidence > 0
                          ? ` · ${alignmentSummary.alignedEvidence}/${alignmentSummary.totalEvidence} kanıt`
                          : ""}{" "}
                        eşleştirildi
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {alignmentSummary.cached
                          ? "Kayıtlı eşleştirme kullanıldı"
                          : `${formatElapsedTime(alignmentElapsedSeconds)} içinde tamamlandı`}
                      </p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      Her bölümden bir cümleyi dinleyerek ses ile metnin doğru
                      hizalandığını kontrol edin.
                    </p>

                    <div className="mt-3 border-y border-neutral-200">
                      {alignmentSummary.sections.map((section) => (
                        <div
                          key={section.sectionId}
                          className="grid gap-2 border-b border-neutral-100 py-3 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)_auto_auto] sm:items-center"
                        >
                          <span className="text-xs font-semibold text-neutral-900">
                            Bölüm {section.partNumber}
                          </span>
                          <span className="min-w-0 truncate text-xs text-neutral-600">
                            {section.reviewSegment?.text ||
                              `${section.alignedSentences}/${section.totalSentences} cümle`}
                          </span>
                          <span className="text-[11px] font-medium tabular-nums text-neutral-500">
                            Güven %{Math.round(section.confidence * 100)}
                          </span>
                          {section.reviewSegment ? (
                            <button
                              type="button"
                              aria-label={`Bölüm ${section.partNumber} eşleştirmesini dinle`}
                              onClick={() =>
                                void handleAlignmentPreview(section)
                              }
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50"
                            >
                              {playingAlignmentPart === section.partNumber ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              {playingAlignmentPart === section.partNumber
                                ? "Durdur"
                                : "Kontrol et"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-neutral-400">
                              Örnek yok
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <nav className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {draft.parts.map((part) => {
            const progress = validation.partProgress[part.number];
            const issueCount = issuesByPart.get(part.number) ?? 0;
            const active = part.number === activePart.number;
            return (
              <button
                key={part.number}
                type="button"
                onClick={() => {
                  setActivePartNumber(part.number);
                  setTranscriptMode("edit");
                }}
                className={`min-w-0 rounded-md border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-neutral-900 bg-white shadow-sm"
                    : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{part.title}</span>
                  {issueCount === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </span>
                <span className="mt-1 block text-[11px] text-neutral-500">
                  {progress.completed}/{progress.total} soru hazır
                </span>
              </button>
            );
          })}
        </nav>

        <section className="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">
                {questionRanges[activePart.number]}
              </p>
              <span className="text-xs font-medium text-neutral-500">
                Hazır gelir, değiştirilebilir
              </span>
            </div>
            <div className="mt-3">
              <TextField
                label="Bölüm yönergesi"
                value={activePart.description}
                onChange={(description) =>
                  updatePart({ ...activePart, description })
                }
                multiline
                rows={3}
              />
            </div>
          </div>

          <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,3fr)_minmax(390px,2fr)]">
            <div className="min-w-0 border-b border-neutral-200 p-4 lg:border-b-0 lg:border-r lg:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Bölüm transcripti
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Yalnızca dinlenen içeriği bir kez yazın.
                  </p>
                </div>
                <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-1">
                  <button
                    type="button"
                    onClick={() => setTranscriptMode("edit")}
                    className={`h-8 rounded px-3 text-xs font-semibold ${
                      transcriptMode === "edit"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    Metni düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranscriptMode("evidence")}
                    className={`h-8 rounded px-3 text-xs font-semibold ${
                      transcriptMode === "evidence"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    Kanıtları işaretle
                  </button>
                </div>
              </div>

              {transcriptMode === "edit" ? (
                <div className="space-y-3">
                  <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-3">
                    <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                      Transcriptte ne yazılmalı?
                    </summary>
                    <div className="mt-3 grid gap-3 text-xs leading-5 text-neutral-600 sm:grid-cols-2">
                      <div>
                        <p className="font-semibold text-neutral-800">Yazın</p>
                        <p className="mt-1">
                          Duyulan konuşmalar, gerekli konuşmacı adları ve
                          öğrencinin anlaması gereken bütün sözcükler.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-800">
                          Yazmayın
                        </p>
                        <p className="mt-1">
                          Sınav yönergeleri, aynı metnin ikinci tekrarı, müzik,
                          sessizlik, doğru cevap veya açıklama.
                        </p>
                      </div>
                    </div>
                  </details>
                  <ListeningTranscriptEditor
                    value={
                      activePart.transcriptFormatted || activePart.transcript
                    }
                    onChange={({ formatted, plain }) =>
                      updatePart({
                        ...activePart,
                        transcript: plain,
                        transcriptFormatted: formatted,
                      })
                    }
                    placeholder={transcriptPlaceholders[activePart.number]}
                  />
                </div>
              ) : (
                <TranscriptEvidenceSelector
                  transcript={activePart.transcript}
                  questions={activePart.questions}
                  activeQuestionNumber={selectedQuestion.number}
                  onSelectQuestion={selectQuestion}
                  onEvidenceChange={(questionNumber, evidence) =>
                    updatePart({
                      ...activePart,
                      questions: activePart.questions.map((question) =>
                        question.number === questionNumber
                          ? { ...question, evidence }
                          : question,
                      ),
                    })
                  }
                />
              )}

              {activePart.number === 4 ? (
                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        Harita veya plan
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Öğrencinin eşleştirme yapacağı görsel.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activePart.imageUrl ? (
                        <button
                          type="button"
                          aria-label="Harita görselini indir"
                          title="Harita görselini indir"
                          disabled={downloadingMedia !== null}
                          onClick={() =>
                            void handleMediaDownload(
                              activePart.imageUrl,
                              "image",
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {downloadingMedia === "image"
                            ? "Hazırlanıyor"
                            : "İndir"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={fileUpload.isPending}
                        onClick={() => imageInputRef.current?.click()}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <ImagePlus className="h-4 w-4" />
                        {activePart.imageUrl
                          ? "Görseli değiştir"
                          : "Görsel yükle"}
                      </button>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleImageUpload(file);
                        event.target.value = "";
                      }}
                    />
                  </div>
                  {activePart.imageUrl ? (
                    <div className="mt-3">
                      <img
                        key={playableImageUrl}
                        src={playableImageUrl}
                        alt="Bölüm 4 harita ön izlemesi"
                        className="max-h-80 w-full rounded-md border border-neutral-200 bg-neutral-50 object-contain"
                        crossOrigin="anonymous"
                        decoding="async"
                        draggable={false}
                        referrerPolicy="no-referrer"
                        onLoad={() => setImagePreviewError("")}
                        onError={() => void handleImagePreviewError()}
                      />
                      {imagePreviewError ? (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {imagePreviewError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                      Görsel henüz yüklenmedi.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <aside className="min-w-0 bg-[#fafaf9] p-4 lg:p-5">
              <QuestionTabs
                partNumber={activePart.number}
                questions={activePart.questions}
                selectedNumber={selectedQuestion.number}
                issues={activePartIssues}
                onSelect={selectQuestion}
              />

              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-neutral-500">
                      S{selectedQuestion.number}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-neutral-900">
                      {[1, 5].includes(activePart.number)
                        ? "Seçenekler ve doğru cevap"
                        : activePart.number === 3
                          ? "Konuşmacı ve doğru cevap"
                          : "Soru ve doğru cevap"}
                    </h2>
                  </div>
                  <span className="rounded bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-600">
                    {selectedQuestion.type === "MATCHING"
                      ? "Eşleştirme"
                      : selectedQuestion.type === "TRUE_FALSE"
                        ? "Doğru / Yanlış"
                        : "Çoktan seçmeli"}
                  </span>
                </div>

                {questionPromptIsEditable ? (
                  <TextField
                    label="Soru metni"
                    value={selectedQuestion.prompt}
                    onChange={(prompt) =>
                      updateQuestion({ ...selectedQuestion, prompt })
                    }
                    placeholder="Öğrencinin göreceği soru"
                    multiline
                    rows={3}
                  />
                ) : fixedQuestionPrompt ? (
                  <div className="rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800">
                    {fixedQuestionPrompt}
                  </div>
                ) : null}

                {isListeningMapMatchingPart(activePart.number) ? (
                  <MapLocationAnswerPicker
                    options={displayedOptions}
                    correctVariant={selectedQuestion.correctVariant}
                    questionNumber={selectedQuestion.number}
                    unavailableCorrectVariants={unavailableCorrectVariants}
                    onCorrectChange={(correctVariant) =>
                      updateQuestion({ ...selectedQuestion, correctVariant })
                    }
                  />
                ) : (
                  <OptionEditor
                    options={displayedOptions}
                    correctVariant={selectedQuestion.correctVariant}
                    questionNumber={selectedQuestion.number}
                    locked={selectedQuestion.type === "TRUE_FALSE"}
                    singleUse={singleUseOptions}
                    unavailableCorrectVariants={unavailableCorrectVariants}
                    onChange={(options) => {
                      if (activePart.optionBank.length > 0) {
                        updatePart({ ...activePart, optionBank: options });
                      } else {
                        updateQuestion({ ...selectedQuestion, options });
                      }
                    }}
                    onCorrectChange={(correctVariant) =>
                      updateQuestion({ ...selectedQuestion, correctVariant })
                    }
                  />
                )}

                <div className="border-t border-neutral-200 pt-5">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-neutral-900">
                      Kanıt ve açıklama
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {activePart.number === 1
                        ? "Kanıt cümlesi seçmek isteğe bağlıdır. Doğru cevabın nedenini yazın; ses aralığını gerekirse elle belirleyin."
                        : "Transcript üzerinden kanıtı seçin. Ses zamanı genel transcript eşleştirmesinden otomatik hazırlanır."}
                    </p>
                  </div>
                  <EvidenceDetails
                    part={activePart}
                    question={selectedQuestion}
                    audioRef={audioRef}
                    audioUrl={playableAudioUrl}
                    audioDurationSeconds={draft.audioDurationSeconds}
                    onChange={(evidence) =>
                      updateQuestion({ ...selectedQuestion, evidence })
                    }
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      </fieldset>

      {showValidation ? (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[82vh] w-full max-w-xl overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Yayın kontrolü
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {validation.ready
                    ? "Test yayınlanmaya hazır."
                    : `${validation.issues.length} eksik alan bulundu.`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Yayın kontrolünü kapat"
                onClick={() => setShowValidation(false)}
                className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[58vh] overflow-y-auto p-5">
              {validation.ready ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <p>Tek ana ses, 6 bölüm, 35 soru ve tüm kanıtlar tamamlandı.</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    Ses ve transcript bir kez eşleştirilir; seçtiğiniz kanıtların
                    zamanları yayın sırasında otomatik hazırlanır.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {validation.issues.map((item, index) => (
                    <button
                      key={`${item.code}-${item.partNumber}-${item.questionNumber}-${index}`}
                      type="button"
                      onClick={() => goToIssue(item)}
                      className="flex w-full items-start justify-between gap-4 rounded-md border border-neutral-200 px-3 py-3 text-left hover:border-neutral-400"
                    >
                      <span>
                        <span className="block text-xs font-semibold text-neutral-900">
                          Bölüm {item.partNumber}
                          {item.questionNumber
                            ? ` · S${item.questionNumber}`
                            : ""}
                        </span>
                        <span className="mt-1 block text-sm text-neutral-600">
                          {item.message}
                        </span>
                      </span>
                      <ArrowLeft className="mt-0.5 h-4 w-4 rotate-180 text-neutral-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowValidation(false)}
                className="h-9 rounded-md border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-700"
              >
                Kapat
              </button>
              {validation.ready && onPublish && !mustRevise ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runOperation(async (current) => {
                    const saved = await onSave(current);
                    if (saved) adoptSavedDraft(saved);
                    await onPublish(saved || current);
                    return saved;
                  })}
                  className="h-9 rounded-md bg-neutral-900 px-4 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isPublishing ? "Yayınlanıyor" : "Kaydet ve yayınla"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
