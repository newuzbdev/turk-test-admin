import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Eye,
  Highlighter,
  PencilLine,
  Save,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getReadingEvidenceSpans,
  getQuestionSource,
  validateOfficialReadingDraft,
  withReadingEvidenceSpans,
  type OfficialReadingDraft,
  type ReadingEvidenceDraft,
  type ReadingEvidenceSpanDraft,
  type ReadingOptionDraft,
  type ReadingPartDraft,
  type ReadingQuestionDraft,
  type ReadingValidationIssue,
} from "./reading-editor-model";
import officialReadingInstructions from "@/data/official-reading-instructions.json";
import ReadingEvidenceExplanationEditor from "./reading-evidence-explanation-editor";

type ReadingExamEditorV3Props = {
  initialDraft: OfficialReadingDraft;
  onSave: ReadingDraftOperation;
  onBack: () => void;
  onPublish?: ReadingDraftOperation;
  onRevise?: ReadingDraftOperation;
  requiresRevision?: boolean;
  onStateChange?: (state: { dirty: boolean; busy: boolean }) => void;
  isSaving?: boolean;
  isPublishing?: boolean;
};

type ReadingDraftOperation = (draft: OfficialReadingDraft) =>
  void | OfficialReadingDraft | Promise<void | OfficialReadingDraft>;

type DraftUpdater = (draft: OfficialReadingDraft) => void;

const cloneDraft = (draft: OfficialReadingDraft) => structuredClone(draft);

const questionRanges: Record<number, string> = {
  1: "Sorular 1-6",
  2: "Sorular 7-14",
  3: "Sorular 15-20",
  4: "Sorular 21-29",
  5: "Sorular 30-35",
};

const sourceLabels: Record<number, { title: string; text: string }> = {
  1: { title: "Metin başlığı", text: "Boşluklu okuma metni" },
  4: { title: "Metin başlığı", text: "Okuma metni" },
  5: { title: "Metin başlığı", text: "A-E paragrafları" },
};

const questionTypeLabel = (question: ReadingQuestionDraft) => {
  if (question.type === "FILL_BLANK") return "Boşluk doldurma";
  if (question.type === "MATCHING") return "Eşleştirme";
  if (question.type === "TRUE_FALSE") return "Doğru / Yanlış / Verilmemiş";
  return "Çoktan seçmeli";
};

const issueSummary = (issues: ReadingValidationIssue[]) => {
  const byPart = new Map<number, number>();
  issues.forEach((item) => byPart.set(item.partNumber, (byPart.get(item.partNumber) ?? 0) + 1));
  return byPart;
};

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 4,
  inputRef,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  ariaLabel?: string;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>
    {multiline ? (
      <textarea
        ref={inputRef}
        aria-label={ariaLabel || label}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      />
    ) : (
      <input
        aria-label={ariaLabel || label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      />
    )}
  </label>
);

const OptionBankEditor = ({
  title,
  options,
  correctVariant,
  questionNumber,
  singleColumn = false,
  onChange,
  onCorrectChange,
}: {
  title: string;
  options: ReadingOptionDraft[];
  correctVariant: string;
  questionNumber: number;
  singleColumn?: boolean;
  onChange: (options: ReadingOptionDraft[]) => void;
  onCorrectChange: (variant: string) => void;
}) => (
  <details open className="border-b border-neutral-200 pb-4">
    <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-semibold text-neutral-900">
      <span>{title}</span>
      <ChevronDown className="h-4 w-4 text-neutral-500" />
    </summary>
    <p className="mt-1 text-xs text-neutral-500">
      Seçenekleri yazın ve doğru olanı aynı satırdan işaretleyin.
    </p>
    <div
      className={`mt-3 grid gap-2 ${
        singleColumn ? "grid-cols-1" : "sm:grid-cols-2"
      }`}
    >
      {options.map((option, index) => (
        <div
          key={option.variant}
          className={`flex min-w-0 items-center gap-2 rounded-md border p-2 transition ${
            correctVariant === option.variant
              ? "border-emerald-300 bg-emerald-50"
              : "border-neutral-200 bg-white"
          }`}
        >
          <input
            type="radio"
            name={`correct-answer-${questionNumber}`}
            aria-label={`${option.variant} seçeneğini doğru cevap yap`}
            checked={correctVariant === option.variant}
            onChange={() => onCorrectChange(option.variant)}
            className="h-4 w-4 shrink-0 accent-emerald-700"
          />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-700">
            {option.variant}
          </span>
          <textarea
            aria-label={`${option.variant} seçeneği`}
            value={option.text}
            onChange={(event) => {
              const next = options.map((candidate, candidateIndex) =>
                candidateIndex === index
                  ? { ...candidate, text: event.target.value }
                  : candidate,
              );
              onChange(next);
            }}
            placeholder="Seçenek metni"
            rows={2}
            className="min-h-12 min-w-0 flex-1 resize-y rounded-md border border-neutral-200 px-2.5 py-2 text-sm leading-5 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
          />
          {correctVariant === option.variant ? (
            <span className="shrink-0 text-[11px] font-semibold text-emerald-700">
              Doğru
            </span>
          ) : null}
        </div>
      ))}
    </div>
  </details>
);

const splitWithEvidenceSpans = (
  source: string,
  evidence: ReadingEvidenceDraft | undefined,
) => {
  const spans = getReadingEvidenceSpans(evidence).filter(
    (span) =>
      span.textStart >= 0 &&
      span.textEnd > span.textStart &&
      source.slice(span.textStart, span.textEnd) === span.evidenceText,
  );

  if (spans.length === 0) {
    return [{ start: 0, end: source.length, text: source, selected: false }];
  }

  const boundaries = Array.from(
    new Set([
      0,
      source.length,
      ...spans.flatMap((span) => [span.textStart, span.textEnd]),
    ]),
  ).sort((left, right) => left - right);

  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1];
    return {
      start,
      end,
      text: source.slice(start, end),
      selected: spans.some(
        (span) => span.textStart <= start && span.textEnd >= end,
      ),
    };
  });
};

type PendingEvidenceSelection = {
  text: string;
  start: number;
  end: number;
  popupLeft: number;
  popupTop: number;
};

const getSelectionOffsets = (container: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const prefix = range.cloneRange();
  prefix.selectNodeContents(container);
  prefix.setEnd(range.startContainer, range.startOffset);
  const text = range.toString();
  const start = prefix.toString().length;
  const rect =
    typeof range.getBoundingClientRect === "function"
      ? range.getBoundingClientRect()
      : null;
  const popupWidth = 126;
  const popupHeight = 42;
  const centeredLeft = rect
    ? rect.left + rect.width / 2 - popupWidth / 2
    : 16;
  const popupLeft = Math.min(
    Math.max(8, centeredLeft),
    Math.max(8, window.innerWidth - popupWidth - 8),
  );
  const belowSelection = rect ? rect.bottom + 8 : 16;
  const popupTop =
    rect && belowSelection + popupHeight > window.innerHeight
      ? Math.max(8, rect.top - popupHeight - 8)
      : belowSelection;

  return text.trim()
    ? {
        text,
        start,
        end: start + text.length,
        popupLeft,
        popupTop,
      }
    : null;
};

const EvidenceSelectionPopover = ({
  selection,
  onCancel,
  onConfirm,
}: {
  selection: PendingEvidenceSelection | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!selection) return null;

  return (
    <div
      role="toolbar"
      aria-label="Kanıt seçimi"
      style={{ left: selection.popupLeft, top: selection.popupTop }}
      className="fixed z-[1200] flex items-center gap-1 rounded-md border border-neutral-200 bg-white p-1 shadow-lg"
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Seçimi iptal et"
        title="Seçimi iptal et"
        className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="inline-flex h-8 items-center gap-1.5 rounded bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800"
      >
        <Highlighter className="h-3.5 w-3.5" />
        Vurgula
      </button>
    </div>
  );
};

type EvidenceRange = {
  questionNumber: number;
  evidence: ReadingEvidenceSpanDraft;
};

const validEvidenceRanges = (
  source: string,
  questions: ReadingQuestionDraft[],
) =>
  questions.flatMap<EvidenceRange>((question) => {
    return getReadingEvidenceSpans(question.evidence).flatMap((evidence) => {
      if (
        evidence.textStart < 0 ||
        evidence.textEnd <= evidence.textStart ||
        source.slice(evidence.textStart, evidence.textEnd) !==
          evidence.evidenceText
      ) {
        return [];
      }
      return [{ questionNumber: question.number, evidence }];
    });
  });

const evidenceSegments = (
  source: string,
  questions: ReadingQuestionDraft[],
) => {
  const ranges = validEvidenceRanges(source, questions);
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
      ranges: ranges.filter(
        ({ evidence }) =>
          evidence.textStart <= start && evidence.textEnd >= end,
      ),
    };
  });
};

const SourceEvidenceMarker = ({
  source,
  questions,
  activeQuestionNumber,
  ariaLabel,
  onSelectQuestion,
  onEvidenceChange,
}: {
  source: string;
  questions: ReadingQuestionDraft[];
  activeQuestionNumber: number;
  ariaLabel: string;
  onSelectQuestion: (questionNumber: number) => void;
  onEvidenceChange: (
    questionNumber: number,
    evidence: ReadingEvidenceDraft,
  ) => void;
}) => {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingEvidenceSelection | null>(null);
  const activeEvidence = questions.find(
    (question) => question.number === activeQuestionNumber,
  )?.evidence;
  const activeEvidenceSpans = getReadingEvidenceSpans(activeEvidence);
  const segments = evidenceSegments(source, questions);

  useEffect(() => {
    setPending(null);
    window.getSelection()?.removeAllRanges();
  }, [activeQuestionNumber, source]);

  if (!source.trim()) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
        Kanıt seçebilmek için önce metni düzenleme modunda yazın.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            S{activeQuestionNumber} için kanıt
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Metindeki ilgili cümleyi seçin.
          </p>
        </div>
        {activeEvidenceSpans.length > 0 ? (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
            {activeEvidenceSpans.length} kanıt
          </span>
        ) : null}
      </div>

      <div
        ref={sourceRef}
        aria-label={ariaLabel}
        onMouseUp={() => {
          if (!sourceRef.current) return;
          setPending(getSelectionOffsets(sourceRef.current));
        }}
        onScroll={() => setPending(null)}
        className="min-h-[480px] max-h-[640px] select-text overflow-y-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-white px-5 py-4 text-[15px] leading-8 text-neutral-800"
      >
        {segments.map((segment) => {
          if (segment.ranges.length === 0) {
            return (
              <span key={`${segment.start}-${segment.end}`}>
                {segment.text}
              </span>
            );
          }

          const questionNumbers = segment.ranges.map(
            ({ questionNumber }) => questionNumber,
          );
          const targetQuestion = questionNumbers.includes(activeQuestionNumber)
            ? activeQuestionNumber
            : questionNumbers[0];
          const active = questionNumbers.includes(activeQuestionNumber);
          const label = questionNumbers
            .map((questionNumber) => `S${questionNumber}`)
            .join(", ");

          return (
            <button
              key={`${segment.start}-${segment.end}`}
              type="button"
              data-label={label}
              aria-label={`${label} kanıtını aç: ${segment.text}`}
              onClick={() => onSelectQuestion(targetQuestion)}
              className={`inline cursor-pointer rounded-sm px-0.5 text-left underline decoration-1 underline-offset-4 transition after:ml-1 after:inline-flex after:rounded after:px-1 after:py-0.5 after:align-middle after:text-[10px] after:font-bold after:leading-none after:content-[attr(data-label)] ${
                active
                  ? "bg-amber-200/80 text-neutral-950 decoration-amber-600 after:bg-amber-600 after:text-white"
                  : "bg-amber-100/70 text-neutral-900 decoration-amber-400 after:bg-amber-200 after:text-amber-900"
              }`}
            >
              {segment.text}
            </button>
          );
        })}
      </div>

      <EvidenceSelectionPopover
        selection={pending}
        onCancel={() => {
          setPending(null);
          window.getSelection()?.removeAllRanges();
        }}
        onConfirm={() => {
          if (!pending) return;
          const nextSpan = {
            evidenceText: pending.text,
            textStart: pending.start,
            textEnd: pending.end,
          };
          const alreadyAdded = activeEvidenceSpans.some(
            (span) =>
              span.textStart === nextSpan.textStart &&
              span.textEnd === nextSpan.textEnd,
          );
          if (!alreadyAdded) {
            onEvidenceChange(
              activeQuestionNumber,
              withReadingEvidenceSpans(
                [...activeEvidenceSpans, nextSpan],
                activeEvidence?.explanation ?? "",
              )!,
            );
          }
          setPending(null);
          window.getSelection()?.removeAllRanges();
        }}
      />
    </div>
  );
};

const EvidenceDetailsEditor = ({
  questionNumber,
  source,
  evidence,
  optionalEvidence = false,
  onChange,
}: {
  questionNumber: number;
  source: string;
  evidence?: ReadingEvidenceDraft;
  optionalEvidence?: boolean;
  onChange: (evidence: ReadingEvidenceDraft | undefined) => void;
}) => {
  if (!evidence && !optionalEvidence) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-white px-4 py-5 text-sm text-neutral-500">
        Solda “Kanıtları işaretle” modunu açıp S{questionNumber} için ilgili
        cümleyi seçin.
      </div>
    );
  }

  const evidenceSpans = getReadingEvidenceSpans(evidence);

  return (
    <div className="space-y-3">
      {optionalEvidence ? <p className="text-xs text-neutral-500">Kanıt cümlesi isteğe bağlıdır. Doğru cevabın açıklamasını yazın.</p> : null}
      <div className="space-y-2">
        {evidenceSpans.map((span, index) => {
          const valid =
            span.textStart >= 0 &&
            span.textEnd > span.textStart &&
            source.slice(span.textStart, span.textEnd) === span.evidenceText;
          return (
            <div
              key={`${span.textStart}-${span.textEnd}`}
              className={`rounded-md border px-3 py-3 ${
                valid
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase text-neutral-500">
                    S{questionNumber} kanıtı {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-800">
                    “{span.evidenceText}”
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`S${questionNumber} kanıtı ${index + 1} kaldır`}
                  onClick={() =>
                    onChange(
                      withReadingEvidenceSpans(
                        evidenceSpans.filter(
                          (_, spanIndex) => spanIndex !== index,
                        ),
                        evidence?.explanation ?? "",
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
                  Metin değişti. Bu kanıtı soldan yeniden seçin.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <ReadingEvidenceExplanationEditor
        value={evidence?.explanation ?? ""}
        onChange={(explanation) => onChange(withReadingEvidenceSpans(evidenceSpans, explanation))}
        rows={4}
      />
    </div>
  );
};

const EvidenceSelector = ({
  source,
  evidence,
  onChange,
}: {
  source: string;
  evidence?: ReadingEvidenceDraft;
  onChange: (evidence: ReadingEvidenceDraft | undefined) => void;
}) => {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingEvidenceSelection | null>(null);
  const evidenceSpans = getReadingEvidenceSpans(evidence);
  const parts = splitWithEvidenceSpans(source, evidence);

  const handleSelection = () => {
    if (!sourceRef.current) return;
    setPending(getSelectionOffsets(sourceRef.current));
  };

  if (!source.trim()) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
        Kanıt seçebilmek için önce metni yazın.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={sourceRef}
        onMouseUp={handleSelection}
        onScroll={() => setPending(null)}
        className="max-h-64 select-text overflow-y-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm leading-7 text-neutral-800"
      >
        {parts.map((part) =>
          part.selected ? (
            <mark
              key={`${part.start}-${part.end}`}
              className="rounded-sm bg-amber-100 px-0.5 text-neutral-900"
            >
              {part.text}
            </mark>
          ) : (
            <span key={`${part.start}-${part.end}`}>{part.text}</span>
          ),
        )}
      </div>

      <EvidenceSelectionPopover
        selection={pending}
        onCancel={() => {
          setPending(null);
          window.getSelection()?.removeAllRanges();
        }}
        onConfirm={() => {
          if (!pending) return;
          const nextSpan = {
            evidenceText: pending.text,
            textStart: pending.start,
            textEnd: pending.end,
          };
          const alreadyAdded = evidenceSpans.some(
            (span) =>
              span.textStart === nextSpan.textStart &&
              span.textEnd === nextSpan.textEnd,
          );
          if (!alreadyAdded) {
            onChange(
              withReadingEvidenceSpans(
                [...evidenceSpans, nextSpan],
                evidence?.explanation ?? "",
              ),
            );
          }
          setPending(null);
          window.getSelection()?.removeAllRanges();
        }}
      />

      {!pending ? (
        <p className="text-xs text-neutral-500">
          Kanıt olan cümleyi fareyle seçin. Seçimin ardından nedenini yazabilirsiniz.
        </p>
      ) : null}

      {evidence && evidenceSpans.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-2">
            {evidenceSpans.map((span, index) => {
              const valid =
                span.textStart >= 0 &&
                span.textEnd > span.textStart &&
                source.slice(span.textStart, span.textEnd) ===
                  span.evidenceText;

              return (
                <div
                  key={`${span.textStart}-${span.textEnd}-${index}`}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                        Kanıt {index + 1}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-neutral-800">
                        “{span.evidenceText}”
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Kanıt ${index + 1} kaldır`}
                      onClick={() =>
                        onChange(
                          withReadingEvidenceSpans(
                            evidenceSpans.filter(
                              (_, spanIndex) => spanIndex !== index,
                            ),
                            evidence.explanation,
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
                      Metin değişti. Bu kanıtı yeniden seçin.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <ReadingEvidenceExplanationEditor
            value={evidence.explanation}
            onChange={(explanation) => onChange({ ...evidence, explanation })}
            rows={3}
          />
        </div>
      ) : null}
    </div>
  );
};

const QuestionTabs = ({
  questions,
  selectedNumber,
  issues,
  onSelect,
}: {
  questions: ReadingQuestionDraft[];
  selectedNumber: number;
  issues: ReadingValidationIssue[];
  onSelect: (number: number) => void;
}) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {questions.map((question) => {
      const hasIssue = issues.some((item) => item.questionNumber === question.number);
      return (
        <button
          key={question.number}
          type="button"
          aria-label={`S${question.number}`}
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
    })}
  </div>
);

const SourceModeToggle = ({
  partNumber,
  mode,
  onChange,
}: {
  partNumber: number;
  mode: "edit" | "evidence";
  onChange: (mode: "edit" | "evidence") => void;
}) => (
  <div
    role="group"
    aria-label={`Bölüm ${partNumber} metin modu`}
    className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-1"
  >
    <button
      type="button"
      onClick={() => onChange("edit")}
      className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-semibold transition ${
        mode === "edit"
          ? "bg-white text-neutral-900 shadow-sm"
          : "text-neutral-500 hover:text-neutral-800"
      }`}
    >
      <PencilLine className="h-3.5 w-3.5" />
      Metni düzenle
    </button>
    <button
      type="button"
      onClick={() => onChange("evidence")}
      className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-semibold transition ${
        mode === "evidence"
          ? "bg-white text-neutral-900 shadow-sm"
          : "text-neutral-500 hover:text-neutral-800"
      }`}
    >
      <Highlighter className="h-3.5 w-3.5" />
      Kanıtları işaretle
    </button>
  </div>
);

const PerQuestionOptionsEditor = ({
  options,
  correctVariant,
  questionNumber,
  onChange,
  onCorrectChange,
  locked = false,
}: {
  options: ReadingOptionDraft[];
  correctVariant: string;
  questionNumber: number;
  onChange: (options: ReadingOptionDraft[]) => void;
  onCorrectChange: (variant: string) => void;
  locked?: boolean;
}) => (
  <div className="space-y-2">
    <div>
      <p className="text-xs font-semibold text-neutral-600">Cevap seçenekleri</p>
      <p className="mt-1 text-xs text-neutral-500">
        Doğru olanı aynı satırdan işaretleyin.
      </p>
    </div>
    {options.map((option, index) => (
      <div
        key={option.variant}
        className={`flex items-center gap-2 rounded-md border p-2 transition ${
          correctVariant === option.variant
            ? "border-emerald-300 bg-emerald-50"
            : "border-neutral-200 bg-white"
        }`}
      >
        <input
          type="radio"
          name={`correct-answer-${questionNumber}`}
          aria-label={`${option.variant} seçeneğini doğru cevap yap`}
          checked={correctVariant === option.variant}
          onChange={() => onCorrectChange(option.variant)}
          className="h-4 w-4 shrink-0 accent-emerald-700"
        />
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-xs font-bold">
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
          className="min-h-12 min-w-0 flex-1 resize-y rounded-md border border-neutral-200 px-2.5 py-2 text-sm leading-5 outline-none disabled:bg-neutral-50 disabled:text-neutral-600 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
        />
        {correctVariant === option.variant ? (
          <span className="shrink-0 text-[11px] font-semibold text-emerald-700">
            Doğru
          </span>
        ) : null}
      </div>
    ))}
  </div>
);

const PartSourceEditor = ({
  part,
  onChange,
  onInsertBlank,
}: {
  part: ReadingPartDraft;
  onChange: (part: ReadingPartDraft) => void;
  onInsertBlank?: (number: number) => void;
}) => {
  const labels = sourceLabels[part.number];
  return (
    <div className="space-y-4">
      <TextField
        label={labels.title}
        value={part.sourceTitle}
        onChange={(sourceTitle) => onChange({ ...part, sourceTitle })}
        placeholder="Örn. Dijital Dünyada Okuma"
      />
      {part.number === 1 ? (
        <div className="flex flex-wrap gap-2">
          {part.questions.map((question) => (
            <button
              key={question.number}
              type="button"
              onClick={() => onInsertBlank?.(question.number)}
              className="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-400"
            >
              S{question.number} boşluğu ekle
            </button>
          ))}
        </div>
      ) : null}
      <TextField
        label={labels.text}
        value={part.sourceText}
        onChange={(sourceText) => onChange({ ...part, sourceText })}
        placeholder={
          part.number === 1
            ? "Metni yazın ve boşlukları ilgili S düğmeleriyle ekleyin."
            : part.number === 5
              ? "A. Birinci paragraf\n\nB. İkinci paragraf..."
              : "Okuma metnini buraya yazın."
        }
        multiline
        rows={18}
        ariaLabel={labels.text}
      />
    </div>
  );
};

const StudentLikePreview = ({
  part,
  onClose,
}: {
  part: ReadingPartDraft;
  onClose: () => void;
}) => {
  const [questionNumber, setQuestionNumber] = useState(part.questions[0]?.number ?? 1);
  const question =
    part.questions.find((candidate) => candidate.number === questionNumber) ??
    part.questions[0];
  const source = question ? getQuestionSource(part, question) : part.sourceText;
  const options = part.optionBank.length > 0 ? part.optionBank : question?.options ?? [];

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col bg-neutral-100">
      <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">Öğrenci ön izlemesi</p>
          <h2 className="text-base font-semibold text-neutral-900">{part.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Ön izlemeyi kapat"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
        <section className="min-h-0 overflow-y-auto border-b border-neutral-200 bg-white p-5 lg:border-b-0 lg:border-r lg:p-8">
          <p className="mb-3 text-xs font-bold uppercase text-neutral-500">
            {part.number === 2 ? question?.sourceTitle || "Bilgi kartı" : part.sourceTitle || "Metin"}
          </p>
          <div className="whitespace-pre-wrap text-base leading-8 text-neutral-800">
            {source || "Bu bölümün metni henüz yazılmadı."}
          </div>
        </section>
        <aside className="min-h-0 overflow-y-auto bg-neutral-50 p-5 lg:p-6">
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {part.questions.map((candidate) => (
              <button
                type="button"
                key={candidate.number}
                onClick={() => setQuestionNumber(candidate.number)}
                className={`h-8 min-w-10 rounded-md border px-2 text-xs font-bold ${
                  candidate.number === questionNumber
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                S{candidate.number}
              </button>
            ))}
          </div>
          {question ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold leading-6 text-neutral-900">
                {question.prompt || `S${question.number} için doğru seçeneği seçin.`}
              </p>
              <div className="space-y-2">
                {options.map((option) => (
                  <div
                    key={option.variant}
                    className="flex items-start gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
                  >
                    <span className="font-bold">{option.variant}.</span>
                    <span>{option.text || "Seçenek metni"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  );
};

export const ReadingExamEditorV3 = ({
  initialDraft,
  onSave,
  onBack,
  onPublish,
  onRevise,
  requiresRevision = false,
  onStateChange,
  isSaving = false,
  isPublishing = false,
}: ReadingExamEditorV3Props) => {
  const [draft, setDraft] = useState(() => cloneDraft(initialDraft));
  const [activePartNumber, setActivePartNumber] = useState(1);
  const [selectedQuestionByPart, setSelectedQuestionByPart] = useState<Record<number, number>>(
    Object.fromEntries(initialDraft.parts.map((part) => [part.number, part.questions[0].number])),
  );
  const [showValidation, setShowValidation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const operationInFlight = useRef(false);
  const [operationPending, setOperationPending] = useState(false);
  const hydratedKey = useRef(initialDraft.testId || initialDraft.ieltsId);
  const busy = operationPending || isSaving || isPublishing;
  const mustRevise = requiresRevision || draft.status === "PUBLISHED" || Boolean(draft.publishedAt);
  const [sourceModeByPart, setSourceModeByPart] = useState<
    Record<number, "edit" | "evidence">
  >({
    1: "edit",
    3: "edit",
    4: "edit",
    5: "edit",
  });
  const partOneTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const key = initialDraft.testId || initialDraft.ieltsId;
    if (hydratedKey.current === key) return;
    hydratedKey.current = key;
    setDraft(cloneDraft(initialDraft));
    setDirty(false);
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

  const runOperation = async (operation: ReadingDraftOperation) => {
    if (busy || operationInFlight.current) return;
    operationInFlight.current = true;
    setOperationPending(true);
    try {
      const saved = await operation(draft);
      if (saved) {
        hydratedKey.current = saved.testId || saved.ieltsId;
        setDraft(cloneDraft(saved));
      }
      setDirty(false);
    } catch {
      // Mutation hooks report the failure; retain the author's draft for retry.
    } finally {
      operationInFlight.current = false;
      setOperationPending(false);
    }
  };

  const validation = useMemo(() => validateOfficialReadingDraft(draft), [draft]);
  const issueCountByPart = useMemo(() => issueSummary(validation.issues), [validation.issues]);
  const activePart =
    draft.parts.find((part) => part.number === activePartNumber) ?? draft.parts[0];
  const selectedQuestionNumber =
    selectedQuestionByPart[activePart.number] ?? activePart.questions[0].number;
  const selectedQuestion =
    activePart.questions.find((question) => question.number === selectedQuestionNumber) ??
    activePart.questions[0];
  const activePartIssues = validation.issues.filter(
    (item) => item.partNumber === activePart.number,
  );
  const activeSourceMode = sourceModeByPart[activePart.number] ?? "edit";

  const setActiveSourceMode = (mode: "edit" | "evidence") => {
    setSourceModeByPart((current) => ({
      ...current,
      [activePart.number]: mode,
    }));
  };

  const updateDraft: DraftUpdater = (next) => {
    if (busy || operationInFlight.current) return;
    setDraft(next);
    setDirty(true);
  };

  const updatePart = (nextPart: ReadingPartDraft) => {
    updateDraft({
      ...draft,
      parts: draft.parts.map((part) => (part.number === nextPart.number ? nextPart : part)),
    });
  };

  const updateQuestion = (nextQuestion: ReadingQuestionDraft) => {
    updatePart({
      ...activePart,
      questions: activePart.questions.map((question) =>
        question.number === nextQuestion.number ? nextQuestion : question,
      ),
    });
  };

  const insertBlank = (questionNumber: number) => {
    const marker = `___ (S${questionNumber})`;
    const element = partOneTextAreaRef.current;
    const start = element?.selectionStart ?? activePart.sourceText.length;
    const end = element?.selectionEnd ?? start;
    const sourceText = `${activePart.sourceText.slice(0, start)}${marker}${activePart.sourceText.slice(end)}`;
    updatePart({ ...activePart, sourceText });
    requestAnimationFrame(() => {
      if (!element) return;
      const cursor = start + marker.length;
      element.focus();
      element.setSelectionRange(cursor, cursor);
    });
  };

  const goToIssue = (item: ReadingValidationIssue) => {
    setActivePartNumber(item.partNumber);
    if (item.questionNumber) {
      setSelectedQuestionByPart((current) => ({
        ...current,
        [item.partNumber]: item.questionNumber as number,
      }));
    }
    setShowValidation(false);
  };

  const source = getQuestionSource(activePart, selectedQuestion);

  return (
    <fieldset disabled={busy} className="min-h-screen min-w-0 border-0 bg-[#f7f7f5] p-0 text-neutral-900" aria-busy={busy}>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Okuma testlerine dön"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold">Okuma testi</h1>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                  {draft.status === "PUBLISHED" ? "Yayında" : "Taslak"}
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
              onClick={() => setShowPreview(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <Eye className="h-4 w-4" />
              Ön izleme
            </button>
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
              {busy ? "İşlem sürüyor" : "Taslağı kaydet"}
            </button>
            {mustRevise && onRevise ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void runOperation(onRevise)}
                className="h-9 rounded-md bg-neutral-900 px-4 text-xs font-semibold text-white disabled:opacity-60"
              >
                Yeni sürüm oluştur
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main inert={busy} className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
        {mustRevise ? (
          <p className="mb-4 text-sm text-neutral-600">
            Bu sınavın mevcut içeriği korunur. Değişikliklerinizi yeni bir taslak sürüme kaydedin.
          </p>
        ) : null}
        <section className="mb-4 grid gap-3 border-b border-neutral-200 pb-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <TextField
            label="Test adı"
            value={draft.title}
            onChange={(title) => updateDraft({ ...draft, title })}
            placeholder="Örn. Millî sertifika okuma denemesi 1"
          />
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="font-semibold">{validation.completedQuestions}/35 soru hazır</span>
            <span aria-hidden="true">·</span>
            <span>60 dakika</span>
          </div>
        </section>

        <nav className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {draft.parts.map((part) => {
            const progress = validation.partProgress[part.number];
            const issueCount = issueCountByPart.get(part.number) ?? 0;
            const active = part.number === activePart.number;
            return (
              <button
                key={part.number}
                type="button"
                onClick={() => setActivePartNumber(part.number)}
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
          <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">
                {questionRanges[activePart.number]}
              </p>
              <span className="text-xs font-medium text-neutral-500">
                Resmî sınav yönergesi
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-700" aria-label="Bölüm yönergesi">
              {officialReadingInstructions.parts[String(activePart.number) as keyof typeof officialReadingInstructions.parts]}
            </p>
          </div>

          <div className="grid min-h-[680px] lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
            <div className="min-w-0 border-b border-neutral-200 p-4 lg:border-b-0 lg:border-r lg:p-5">
              {[1, 4, 5].includes(activePart.number) ? (
                <div className="space-y-5">
                  {activePart.number === 1 ? (
                    <>
                      <TextField
                        label="Metin başlığı"
                        value={activePart.sourceTitle}
                        onChange={(sourceTitle) =>
                          updatePart({ ...activePart, sourceTitle })
                        }
                        placeholder="Örn. Teknoloji ve günlük yaşam"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-neutral-600">
                          Boşluklu okuma metni
                        </p>
                        <SourceModeToggle
                          partNumber={activePart.number}
                          mode={activeSourceMode}
                          onChange={setActiveSourceMode}
                        />
                      </div>
                      {activeSourceMode === "edit" ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {activePart.questions.map((question) => (
                              <button
                                key={question.number}
                                type="button"
                                onClick={() => insertBlank(question.number)}
                                className="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-400"
                              >
                                S{question.number} boşluğu ekle
                              </button>
                            ))}
                          </div>
                          <TextField
                            label="Metin"
                            ariaLabel="Boşluklu okuma metni"
                            value={activePart.sourceText}
                            onChange={(sourceText) =>
                              updatePart({ ...activePart, sourceText })
                            }
                            placeholder="Metni yazın ve boşlukları ilgili S düğmeleriyle ekleyin."
                            multiline
                            rows={20}
                            inputRef={partOneTextAreaRef}
                          />
                        </>
                      ) : (
                        <SourceEvidenceMarker
                          source={activePart.sourceText}
                          questions={activePart.questions}
                          activeQuestionNumber={selectedQuestion.number}
                          ariaLabel="Bölüm 1 kanıt metni"
                          onSelectQuestion={(questionNumber) =>
                            setSelectedQuestionByPart((current) => ({
                              ...current,
                              [activePart.number]: questionNumber,
                            }))
                          }
                          onEvidenceChange={(questionNumber, evidence) => {
                            const targetQuestion = activePart.questions.find(
                              (question) =>
                                question.number === questionNumber,
                            );
                            if (!targetQuestion) return;
                            updateQuestion({
                              ...targetQuestion,
                              evidence,
                            });
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-end">
                        <SourceModeToggle
                          partNumber={activePart.number}
                          mode={activeSourceMode}
                          onChange={setActiveSourceMode}
                        />
                      </div>
                      {activeSourceMode === "edit" ? (
                        <PartSourceEditor
                          part={activePart}
                          onChange={updatePart}
                        />
                      ) : (
                        <SourceEvidenceMarker
                          source={activePart.sourceText}
                          questions={activePart.questions}
                          activeQuestionNumber={selectedQuestion.number}
                          ariaLabel={`Bölüm ${activePart.number} kanıt metni`}
                          onSelectQuestion={(questionNumber) =>
                            setSelectedQuestionByPart((current) => ({
                              ...current,
                              [activePart.number]: questionNumber,
                            }))
                          }
                          onEvidenceChange={(questionNumber, evidence) => {
                            const targetQuestion = activePart.questions.find(
                              (question) =>
                                question.number === questionNumber,
                            );
                            if (!targetQuestion) return;
                            updateQuestion({
                              ...targetQuestion,
                              evidence,
                            });
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              ) : activePart.number === 2 ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Bilgi kartları (7-14)
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Her soru öğrenci ekranında ayrı bir metin kartı olarak görünür.
                    </p>
                  </div>
                  <TextField
                    label="Kart başlığı"
                    ariaLabel={`S${selectedQuestion.number} kart başlığı`}
                    value={selectedQuestion.sourceTitle}
                    onChange={(sourceTitle) =>
                      updateQuestion({ ...selectedQuestion, sourceTitle })
                    }
                    placeholder="Örn. Şehir Kütüphanesi"
                  />
                  <TextField
                    label="Kart metni"
                    ariaLabel={`S${selectedQuestion.number} kart metni`}
                    value={selectedQuestion.sourceText}
                    onChange={(sourceText) =>
                      updateQuestion({ ...selectedQuestion, sourceText })
                    }
                    placeholder="Öğrencinin okuyacağı bilgi metnini yazın."
                    multiline
                    rows={16}
                  />
                  <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                      İsteğe bağlı görsel
                    </summary>
                    <div className="mt-3">
                      <TextField
                        label="Görsel adresi"
                        value={selectedQuestion.imageUrl ?? ""}
                        onChange={(imageUrl) =>
                          updateQuestion({ ...selectedQuestion, imageUrl })
                        }
                        placeholder="Görsel yalnızca gerekliyse eklenir."
                      />
                    </div>
                  </details>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          Paragraf {["I", "II", "III", "IV", "V", "VI"][selectedQuestion.number - 15]}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Başlık seçeneği sağ taraftan belirlenir.
                        </p>
                      </div>
                      <SourceModeToggle
                        partNumber={activePart.number}
                        mode={activeSourceMode}
                        onChange={setActiveSourceMode}
                      />
                    </div>
                  </div>
                  {activeSourceMode === "edit" ? (
                    <TextField
                      label="Paragraf metni"
                      value={selectedQuestion.sourceText}
                      onChange={(sourceText) =>
                        updateQuestion({ ...selectedQuestion, sourceText })
                      }
                      placeholder="Paragrafı buraya yazın."
                      multiline
                      rows={20}
                    />
                  ) : (
                    <SourceEvidenceMarker
                      source={selectedQuestion.sourceText}
                      questions={[selectedQuestion]}
                      activeQuestionNumber={selectedQuestion.number}
                      ariaLabel="Bölüm 3 kanıt metni"
                      onSelectQuestion={() => undefined}
                      onEvidenceChange={(_, evidence) =>
                        updateQuestion({ ...selectedQuestion, evidence })
                      }
                    />
                  )}
                </div>
              )}
            </div>

            <aside className="min-w-0 bg-[#fbfbfa] p-4 lg:p-5">
              <div className="space-y-5">
                <QuestionTabs
                  questions={activePart.questions}
                  selectedNumber={selectedQuestion.number}
                  issues={activePartIssues}
                  onSelect={(number) =>
                    setSelectedQuestionByPart((current) => ({
                      ...current,
                      [activePart.number]: number,
                    }))
                  }
                />

                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      S{selectedQuestion.number}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {questionTypeLabel(selectedQuestion)}
                    </p>
                  </div>
                  <span className="rounded bg-white px-2 py-1 text-[11px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
                    1 puan
                  </span>
                </div>

                {activePart.optionBank.length > 0 ? (
                  <OptionBankEditor
                    title={
                      activePart.number === 2
                        ? "Durum seçenekleri (A-J)"
                        : activePart.number === 3
                          ? "Başlık seçenekleri (A-H)"
                          : "Ortak seçenekler (A-H)"
                    }
                    options={activePart.optionBank}
                    correctVariant={selectedQuestion.correctVariant}
                    questionNumber={selectedQuestion.number}
                    singleColumn
                    onChange={(optionBank) => updatePart({ ...activePart, optionBank })}
                    onCorrectChange={(correctVariant) =>
                      updateQuestion({ ...selectedQuestion, correctVariant })
                    }
                  />
                ) : null}

                {[4, 5].includes(activePart.number) ? (
                  <>
                    <TextField
                      label="Soru"
                      ariaLabel={`S${selectedQuestion.number} soru metni`}
                      value={selectedQuestion.prompt}
                      onChange={(prompt) => updateQuestion({ ...selectedQuestion, prompt })}
                      placeholder="Soru metnini yazın."
                      multiline
                      rows={3}
                    />
                    <PerQuestionOptionsEditor
                      options={selectedQuestion.options}
                      correctVariant={selectedQuestion.correctVariant}
                      questionNumber={selectedQuestion.number}
                      locked={
                        selectedQuestion.type === "TRUE_FALSE" ||
                        (activePart.number === 5 && selectedQuestion.number >= 33)
                      }
                      onChange={(options) =>
                        updateQuestion({ ...selectedQuestion, options })
                      }
                      onCorrectChange={(correctVariant) =>
                        updateQuestion({ ...selectedQuestion, correctVariant })
                      }
                    />
                  </>
                ) : null}

                <div className="border-t border-neutral-200 pt-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-neutral-900">
                      Kanıt ve açıklama
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Öğrenci sonuç ekranında bu metin ve açıklama gösterilir.
                    </p>
                  </div>
                  {[1, 3, 4, 5].includes(activePart.number) ? (
                    <EvidenceDetailsEditor
                      questionNumber={selectedQuestion.number}
                      source={source}
                      evidence={selectedQuestion.evidence}
                      optionalEvidence={activePart.number === 1}
                      onChange={(evidence) =>
                        updateQuestion({ ...selectedQuestion, evidence })
                      }
                    />
                  ) : (
                    <EvidenceSelector
                      source={source}
                      evidence={selectedQuestion.evidence}
                      onChange={(evidence) =>
                        updateQuestion({ ...selectedQuestion, evidence })
                      }
                    />
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {showValidation ? (
        <div className="fixed inset-0 z-[1050] flex items-end justify-center bg-black/25 p-0 sm:items-center sm:p-6">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-t-lg bg-white shadow-xl sm:rounded-lg">
            <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  {validation.ready ? "Yayına hazır" : "Yayına hazır değil"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {validation.ready
                    ? "Beş bölüm ve 35 soru eksiksiz."
                    : `${validation.completedQuestions}/35 soru tamamlandı. Eksik alana tıklayarak düzenleyin.`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Yayın kontrolünü kapat"
                onClick={() => setShowValidation(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {validation.ready ? (
                <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                  <CheckCircle2 className="h-5 w-5" />
                  Test yayınlanabilir.
                </div>
              ) : (
                <div className="space-y-2">
                  {validation.issues.map((item, index) => (
                    <button
                      type="button"
                      key={`${item.code}-${item.partNumber}-${item.questionNumber}-${index}`}
                      onClick={() => goToIssue(item)}
                      aria-label={
                        item.questionNumber
                          ? `S${item.questionNumber}: ${item.message}`
                          : `${item.partNumber}. bölüm: ${item.message}`
                      }
                      className="flex w-full items-start justify-between gap-4 rounded-md border border-neutral-200 px-3 py-3 text-left hover:border-neutral-400 hover:bg-neutral-50"
                    >
                      <span>
                        <span className="block text-xs font-bold text-neutral-500">
                          {item.questionNumber
                            ? `Bölüm ${item.partNumber} · S${item.questionNumber}`
                            : `Bölüm ${item.partNumber}`}
                        </span>
                        <span className="mt-1 block text-sm text-neutral-800">
                          {item.message}
                        </span>
                      </span>
                      <ArrowLeft className="mt-1 h-4 w-4 rotate-180 text-neutral-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-3">
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
                    if (saved) {
                      setDraft(cloneDraft(saved));
                      setDirty(false);
                    }
                    await onPublish(saved || current);
                    return saved;
                  })}
                  className="h-9 rounded-md bg-neutral-900 px-4 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isPublishing ? "Yayınlanıyor" : "Yayınla"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showPreview ? (
        <StudentLikePreview part={activePart} onClose={() => setShowPreview(false)} />
      ) : null}
    </fieldset>
  );
};
