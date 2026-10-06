import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Button,
  Input,
  message,
  Modal,
  Progress,
  Result,
  Select,
  Skeleton,
  Tabs,
  Tag,
} from "antd";
import { Check, Save as SaveIcon, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";
import {
  checkSpeakingV2Publication,
  speakingV2ListKey,
  speakingV2Keys,
  useDeleteSpeakingPromptAudio,
  useGenerateSpeakingPromptAudio,
  usePublishSpeakingV2,
  useReviseSpeakingV2,
  useSpeakingV2,
  useUpdateSpeakingV2,
} from "@/config/queries/speaking/v2.queries";

import { FixedImageSlots } from "./components/fixed-image-slots";
import { FixedQuestionList } from "./components/fixed-question-list";
import { Part3PointsEditor } from "./components/part-3-points-editor";
import { PromptAudioGroup } from "./components/prompt-audio-status";
import { VisualContextFields } from "./components/visual-context-fields";
import {
  getSpeakingV2Completion,
  isSpeakingV2,
  toSpeakingV2UpdateInput,
  type SpeakingAdminView,
  type SpeakingReadinessIssue,
  type SpeakingTaskCode,
  type SpeakingV2AdminView,
  type SpeakingV2EditorTasks,
  type SpeakingV2PromptKey,
} from "./types";
import "./speaking-v2.css";

const TASK_TABS = [
  { key: "TASK_1_1", label: "Bölüm 1.1" },
  { key: "TASK_1_2", label: "Bölüm 1.2" },
  { key: "TASK_2", label: "Bölüm 2" },
  { key: "TASK_3", label: "Bölüm 3" },
] as const;

const REQUIRED_PROMPT_AUDIO_KEYS = new Set<SpeakingV2PromptKey>([
  "TASK_1_1_Q1",
  "TASK_1_1_Q2",
  "TASK_1_1_Q3",
  "TASK_1_2_Q1",
  "TASK_1_2_Q2",
  "TASK_1_2_Q3",
]);

const statusLabels = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivde",
} as const;

const taskTitles: Record<SpeakingTaskCode, string> = {
  TASK_1_1: "Kişisel sorular",
  TASK_1_2: "Görsel karşılaştırma",
  TASK_2: "Görsel anlatımı",
  TASK_3: "Tartışma sorusu",
};

const taskSummaries: Record<SpeakingTaskCode, string> = {
  TASK_1_1: "3 soru · Her biri 30 sn",
  TASK_1_2: "2 görsel · 3 soru · Her biri 30 sn",
  TASK_2: "60 sn hazırlık · 120 sn cevap",
  TASK_3: "60 sn hazırlık · 120 sn cevap",
};

const AUTOSAVE_DELAY_MS = 600;

type EpochOperation = {
  epoch: number;
  token: symbol;
};

type PendingImageUpload = EpochOperation & {
  promise: Promise<void>;
};

type AppliedServerSnapshot = {
  accepted: boolean;
  snapshot: SpeakingV2AdminView;
};

function TaskTabLabel({ label, complete }: { label: string; complete: boolean }) {
  return (
    <span>
      {label}
      {complete ? <Check size={14} aria-label="Tamamlandı" /> : null}
    </span>
  );
}

function EditorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="speaking-v2-form-section">
      <h3>{title}</h3>
      <div className="speaking-v2-form-section-content">{children}</div>
    </section>
  );
}

function publicationIssues(error: unknown): SpeakingReadinessIssue[] {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return [];
  }

  const response = error.response;
  if (typeof response !== "object" || response === null || !("data" in response)) {
    return [];
  }

  const payload = response.data as {
    issues?: SpeakingReadinessIssue[];
    response?: { issues?: SpeakingReadinessIssue[] };
    error?: { issues?: SpeakingReadinessIssue[] };
  };
  return payload.issues || payload.response?.issues || payload.error?.issues || [];
}

function getSpeakingV2ErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return null;
  }

  const response = error.response;
  if (typeof response !== "object" || response === null || !("data" in response)) {
    return null;
  }

  const payload = response.data as {
    code?: string;
    error?: string | { code?: string };
  };
  if (payload.code) return payload.code;
  return typeof payload.error === "object" ? payload.error?.code || null : null;
}

function getSpeakingV2ErrorMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return error instanceof Error ? error.message : null;
  }

  const response = error.response;
  if (typeof response !== "object" || response === null || !("data" in response)) {
    return null;
  }

  const payload = response.data as {
    message?: string | string[];
    error?: string | { message?: string | string[] };
  };
  const message =
    payload.message ||
    (typeof payload.error === "object" ? payload.error?.message : payload.error);
  if (Array.isArray(message)) return message.join(" ");
  if (message) return message;
  try {
    return JSON.stringify(response.data);
  } catch {
    return null;
  }
}

const replaceTupleItem = <T,>(
  values: [T, T, T],
  index: 0 | 1 | 2,
  value: T,
): [T, T, T] =>
  values.map((item, itemIndex) => (itemIndex === index ? value : item)) as [
    T,
    T,
    T,
  ];

function reconcileVisualContext(
  images: readonly string[],
  context: SpeakingV2AdminView["tasks"]["TASK_1_2"]["visualContext"],
) {
  return {
    verified: false,
    descriptions: images.map((imageUrl) => ({
      imageUrl,
      description:
        context.descriptions.find((item) => item.imageUrl === imageUrl)
          ?.description ?? "",
    })),
  };
}

function EditorHeader({
  draft,
  readOnly,
  editingLocked,
  saving,
  publishing,
  revising,
  saveState,
  onIdentityChange,
  onSave,
  onPublish,
  onRevise,
}: {
  draft: SpeakingV2AdminView;
  readOnly: boolean;
  editingLocked: boolean;
  saving: boolean;
  publishing: boolean;
  revising: boolean;
  saveState: string;
  onIdentityChange: (value: Pick<SpeakingV2AdminView, "title" | "ieltsId">) => void;
  onSave: () => Promise<SpeakingV2AdminView | null>;
  onPublish: () => Promise<void>;
  onRevise: () => Promise<void>;
}) {
  const { data: packages, isLoading } = useGetAllIelts();
  const options =
    packages?.ieltsData?.map((item) => ({ label: item.title, value: item.id })) ??
    [];

  return (
    <header className="speaking-v2-header">
      <div className="speaking-v2-identity">
        <label className="speaking-v2-header-field">
          <span>Test adı</span>
          <Input
            aria-label="Test adı"
            value={draft.title}
            disabled={readOnly || editingLocked}
            onChange={(event) =>
              onIdentityChange({
                title: event.target.value,
                ieltsId: draft.ieltsId,
              })
            }
          />
        </label>
        <label className="speaking-v2-header-field">
          <span>Mock test paketi</span>
          <Select
            aria-label="Mock test grubu"
            value={draft.ieltsId}
            options={options}
            loading={isLoading}
            disabled={readOnly || editingLocked}
            showSearch
            optionFilterProp="label"
            onChange={(ieltsId) =>
              onIdentityChange({ title: draft.title, ieltsId })
            }
          />
        </label>
        <div className="speaking-v2-header-status">
          <span>Durum</span>
          <Tag>{statusLabels[draft.status]}</Tag>
        </div>
      </div>
      <div className="speaking-v2-header-actions">
        <span className="speaking-v2-save-state" role="status">
          {saveState}
        </span>
        <div className="speaking-v2-action-buttons">
          {readOnly ? (
            <Button
              disabled={editingLocked || revising}
              loading={revising}
              onClick={() => void onRevise()}
            >
              Yeni sürüm oluştur
            </Button>
          ) : (
            <>
              <Button
                icon={<SaveIcon size={16} />}
                disabled={editingLocked}
                loading={saving}
                onClick={() => void onSave()}
              >
                {draft.status === "PUBLISHED"
                  ? "Taslağa al ve kaydet"
                  : "Taslağı kaydet"}
              </Button>
              <Button
                type="primary"
                icon={<Send size={16} />}
                disabled={editingLocked}
                loading={publishing}
                onClick={() => void onPublish()}
              >
                Yayınla
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function TaskEditor({
  taskCode,
  draft,
  readOnly,
  editingLocked,
  issues,
  onChange,
  onImageUploadStart,
  onRetryAudio,
  onDeleteAudio,
  pendingKeys,
}: {
  taskCode: SpeakingTaskCode;
  draft: SpeakingV2AdminView;
  readOnly: boolean;
  editingLocked: boolean;
  issues: SpeakingReadinessIssue[];
  onChange: (
    updater: (current: SpeakingV2AdminView) => SpeakingV2AdminView,
    allowWhilePublishing?: boolean,
  ) => void;
  onImageUploadStart: (
    start: (isCurrent: () => boolean) => Promise<void>,
  ) => void;
  onRetryAudio: (key: SpeakingV2PromptKey) => Promise<void>;
  onDeleteAudio: (key: SpeakingV2PromptKey) => Promise<void>;
  pendingKeys: ReadonlySet<SpeakingV2PromptKey>;
}) {
  const disabled = readOnly || editingLocked;
  const updateTask = <K extends SpeakingTaskCode>(
    code: K,
    updater: (task: SpeakingV2EditorTasks[K]) => SpeakingV2EditorTasks[K],
    allowWhilePublishing = false,
  ) =>
    onChange(
      (current) => ({
        ...current,
        tasks: {
          ...current.tasks,
          [code]: updater(current.tasks[code]),
        },
      }),
      allowWhilePublishing,
    );
  const questionEditor = (
    code: "TASK_1_1" | "TASK_1_2" | "TASK_2",
    durationSeconds?: number,
  ) => {
    const task = draft.tasks[code];
    return (
      <FixedQuestionList
        questions={task.questions}
        durationSeconds={durationSeconds}
        disabled={disabled}
        onChange={(index, text) =>
          updateTask(code, (current) => ({
            ...current,
            questions: replaceTupleItem(current.questions, index, {
              ...current.questions[index],
              text,
            }),
          }))
        }
      />
    );
  };

  return (
    <section className="speaking-v2-task-panel">
      <div className="speaking-v2-task-heading">
        <h2 className="speaking-v2-task-title">{taskTitles[taskCode]}</h2>
        <span>{taskSummaries[taskCode]}</span>
      </div>
      {issues.length > 0 && (
        <Alert
          className="speaking-v2-readiness-alert"
          type="error"
          message={`${issues.length} alan tamamlanmalı`}
          description={
            <ul>
              {issues.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          }
          showIcon
        />
      )}

      <EditorSection title="Bölüm anlatımı">
        <Input.TextArea
          aria-label="Bölüm anlatımı"
          value={draft.tasks[taskCode].instruction ?? ""}
          disabled={disabled}
          autoSize={{ minRows: 2, maxRows: 5 }}
          onChange={(event) => {
            const instruction = event.target.value;
            updateTask(taskCode, (current) => ({
              ...current,
              instruction,
            }));
          }}
        />
      </EditorSection>

      {taskCode === "TASK_1_1" && (
        <EditorSection title="Sorular">
          {questionEditor("TASK_1_1", 30)}
        </EditorSection>
      )}

      {taskCode === "TASK_1_2" && (
        <>
          <EditorSection title="Görseller">
            <>
              <FixedImageSlots
                images={draft.tasks.TASK_1_2.images}
                limit={2}
                disabled={disabled}
                onUploadStart={onImageUploadStart}
                onChange={(updateImages, source) =>
                  updateTask(
                    "TASK_1_2",
                    (current) => {
                      const images = updateImages(current.images);
                      return {
                        ...current,
                        images,
                        visualContext: reconcileVisualContext(
                          images,
                          current.visualContext,
                        ),
                      };
                    },
                    source === "upload",
                  )
                }
              />
              <VisualContextFields
                images={draft.tasks.TASK_1_2.images}
                context={draft.tasks.TASK_1_2.visualContext}
                disabled={disabled}
                onChange={(visualContext) =>
                  updateTask("TASK_1_2", (current) => ({
                    ...current,
                    visualContext,
                  }))
                }
              />
            </>
          </EditorSection>
          <EditorSection title="Sorular">
            {questionEditor("TASK_1_2", 30)}
          </EditorSection>
        </>
      )}

      {taskCode === "TASK_2" && (
        <>
          <EditorSection title="Görsel">
            <>
              <FixedImageSlots
                images={draft.tasks.TASK_2.images}
                limit={1}
                disabled={disabled}
                onUploadStart={onImageUploadStart}
                onChange={(updateImages, source) =>
                  updateTask(
                    "TASK_2",
                    (current) => {
                      const images = updateImages(current.images);
                      return {
                        ...current,
                        images,
                        visualContext: reconcileVisualContext(
                          images,
                          current.visualContext,
                        ),
                      };
                    },
                    source === "upload",
                  )
                }
              />
              <VisualContextFields
                images={draft.tasks.TASK_2.images}
                context={draft.tasks.TASK_2.visualContext}
                disabled={disabled}
                onChange={(visualContext) =>
                  updateTask("TASK_2", (current) => ({
                    ...current,
                    visualContext,
                  }))
                }
              />
            </>
          </EditorSection>
          <EditorSection title="Yönlendirici sorular">
            {questionEditor("TASK_2")}
          </EditorSection>
        </>
      )}

      {taskCode === "TASK_3" && (
        <>
          <EditorSection title="Tartışma ifadesi">
            <Input.TextArea
              aria-label="Tartışma ifadesi"
              value={draft.tasks.TASK_3.statement}
              disabled={disabled}
              autoSize={{ minRows: 2, maxRows: 5 }}
              onChange={(event) =>
                updateTask("TASK_3", (current) => ({
                  ...current,
                  statement: event.target.value,
                }))
              }
            />
          </EditorSection>
          <EditorSection title="Konuşma yönleri">
            <Part3PointsEditor
              advantages={draft.tasks.TASK_3.advantages}
              disadvantages={draft.tasks.TASK_3.disadvantages}
              disabled={disabled}
              onChange={(side, index, value) =>
                updateTask("TASK_3", (current) => ({
                  ...current,
                  [side]: replaceTupleItem(current[side], index, value),
                }))
              }
            />
          </EditorSection>
        </>
      )}

      <PromptAudioGroup
        taskCode={taskCode}
        items={draft.audioItems.filter((item) => item.taskCode === taskCode)}
        disabled={disabled}
        pendingKeys={pendingKeys}
        onRetry={onRetryAudio}
        onDelete={onDeleteAudio}
      />
    </section>
  );
}

function LegacyArchive({ data }: { data: Extract<SpeakingAdminView, { formatVersion: 1 }> }) {
  return (
    <main className="speaking-v2-editor speaking-v1-archive">
      <Tag>Eski format · Salt okunur</Tag>
      <h1>{data.title}</h1>
      <p>Bu sınav sonuç geçmişi için salt okunur olarak saklanıyor.</p>
      <div className="legacy-speaking-summary">
        {data.legacySummary.map((section) => (
          <div key={section.id}>
            <span>{section.title || `Bölüm ${section.order}`}</span>
            <span>{section.questionCount} soru</span>
          </div>
        ))}
      </div>
    </main>
  );
}

export function SpeakingEditorPageV2() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useSpeakingV2(id);
  const update = useUpdateSpeakingV2({ autoCommit: false });
  const updateDraftMutation = update.mutateAsync;
  const publish = usePublishSpeakingV2({ autoCommit: false });
  const generateAudio = useGenerateSpeakingPromptAudio({ autoCommit: false });
  const deleteAudio = useDeleteSpeakingPromptAudio({ autoCommit: false });
  const revise = useReviseSpeakingV2({ autoCommit: false });
  const [activeTask, setActiveTask] = useState<SpeakingTaskCode>("TASK_1_1");
  const [draft, setDraft] = useState<SpeakingV2AdminView | null>(null);
  const [issues, setIssues] = useState<SpeakingReadinessIssue[]>([]);
  const [audioProgress, setAudioProgress] = useState({ completed: 0, total: 0 });
  const [conflictOpen, setConflictOpen] = useState(false);
  const [saveState, setSaveState] = useState("Taslak hazır");
  const [isDirty, setIsDirty] = useState(false);
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [publishingFlow, setPublishingFlow] = useState(false);
  const [pendingImageUploadCount, setPendingImageUploadCount] = useState(0);
  const [discarding, setDiscarding] = useState(false);
  const [revising, setRevising] = useState(false);
  const [generatingKeys, setGeneratingKeys] = useState<Set<SpeakingV2PromptKey>>(
    new Set(),
  );
  const draftRef = useRef<SpeakingV2AdminView | null>(null);
  const latestServerRef = useRef<SpeakingV2AdminView | null>(null);
  const acceptedUpdatedAtRef = useRef<string | null>(null);
  const localVersionRef = useRef(0);
  const persistedVersionRef = useRef(0);
  const draftEpochRef = useRef(0);
  const dirtyRef = useRef(false);
  const queuedAutosaveVersionRef = useRef<number | null>(null);
  const saveQueueRef = useRef<Promise<SpeakingV2AdminView | null>>(
    Promise.resolve(null),
  );
  const generatingKeysRef = useRef(
    new Map<SpeakingV2PromptKey, EpochOperation>(),
  );
  const pendingImageUploadsRef = useRef(
    new Map<symbol, PendingImageUpload>(),
  );
  const publicationOperationRef = useRef<EpochOperation | null>(null);
  const revisionOperationRef = useRef<EpochOperation | null>(null);
  const publishingRef = useRef(false);
  const discardingRef = useRef(false);
  const unmountedRef = useRef(false);
  const flushOnExitRef = useRef<() => void>(() => undefined);

  const isCurrentEpoch = useCallback(
    (epoch: number) =>
      epoch === draftEpochRef.current && !unmountedRef.current,
    [],
  );

  const applyServerSnapshot = useCallback(
    (
      incoming: SpeakingV2AdminView,
      requestVersion?: number,
      replaceLocal = false,
    ): AppliedServerSnapshot => {
      const known = latestServerRef.current;
      if (
        known &&
        Date.parse(incoming.updatedAt) < Date.parse(known.updatedAt)
      ) {
        return {
          accepted: false,
          snapshot: draftRef.current ?? known,
        };
      }
      latestServerRef.current = incoming;

      const preserveLocal =
        !replaceLocal &&
        (requestVersion === undefined
          ? dirtyRef.current
          : localVersionRef.current > requestVersion);
      const current = draftRef.current;
      if (requestVersion === undefined && preserveLocal && current) {
        return { accepted: true, snapshot: current };
      }

      acceptedUpdatedAtRef.current = incoming.updatedAt;
      const next =
        current && preserveLocal
          ? {
              ...current,
              status: incoming.status,
              publishedAt: incoming.publishedAt,
              updatedAt: incoming.updatedAt,
              submissionCount: incoming.submissionCount,
              activeAttemptCount: incoming.activeAttemptCount,
              audioItems: incoming.audioItems,
              readiness: incoming.readiness,
            }
          : incoming;

      draftRef.current = next;
      if (!unmountedRef.current) {
        setDraft(next);
        if (!preserveLocal) setIssues(incoming.readiness.issues);
      }
      return { accepted: true, snapshot: next };
    },
    [],
  );

  const commitServerSnapshot = useCallback(
    (
      incoming: SpeakingV2AdminView,
      requestVersion: number,
      operationEpoch: number,
    ) => {
      if (!isCurrentEpoch(operationEpoch)) return null;
      const applied = applyServerSnapshot(incoming, requestVersion);
      if (!applied.accepted) return null;
      if (!isCurrentEpoch(operationEpoch)) return null;
      queryClient.setQueryData(speakingV2Keys.detail(incoming.id), incoming);
      void queryClient.invalidateQueries({ queryKey: speakingV2ListKey });
      return applied.snapshot;
    },
    [applyServerSnapshot, isCurrentEpoch, queryClient],
  );

  const persistSnapshot = useCallback(
    async (
      snapshot: SpeakingV2AdminView,
      version: number,
      reportError: boolean,
      operationEpoch: number,
      allowUnmountedStart: boolean,
    ) => {
      if (
        operationEpoch !== draftEpochRef.current ||
        (unmountedRef.current && !allowUnmountedStart)
      ) {
        return null;
      }
      if (!unmountedRef.current) {
        setPendingSaveCount((count) => count + 1);
        setSaveState("Taslak kaydediliyor");
      }
      try {
        const expectedUpdatedAt =
          acceptedUpdatedAtRef.current ?? snapshot.updatedAt;
        const saved = await updateDraftMutation({
          id: snapshot.id,
          input: toSpeakingV2UpdateInput({
            ...snapshot,
            updatedAt: expectedUpdatedAt,
          }),
        });
        if (!isCurrentEpoch(operationEpoch)) return null;
        const committed = commitServerSnapshot(saved, version, operationEpoch);
        if (!committed) {
          if (!unmountedRef.current && dirtyRef.current) {
            setSaveState("Kaydedilmemiş değişiklikler");
          }
          return null;
        }
        persistedVersionRef.current = Math.max(
          persistedVersionRef.current,
          version,
        );

        if (localVersionRef.current === version) {
          dirtyRef.current = false;
          if (!unmountedRef.current) {
            setIsDirty(false);
            setSaveState("Taslak kaydedildi");
          }
        } else if (!unmountedRef.current) {
          setSaveState("Kaydedilmemiş değişiklikler");
        }
        return committed;
      } catch (error) {
        if (!isCurrentEpoch(operationEpoch)) return null;
        const errorMessage = getSpeakingV2ErrorMessage(error);
        console.error(
          `[Speaking V2] Taslak kaydi basarisiz: ${errorMessage || "Bilinmeyen hata"}`,
          error,
        );
        if (!unmountedRef.current) {
          if (getSpeakingV2ErrorCode(error) === "SPEAKING_EDIT_CONFLICT") {
            setConflictOpen(true);
          } else if (reportError) {
            message.error(
              "Taslak kaydedilemedi. Girdileriniz ekranda korunuyor; yeniden deneyin.",
            );
          }
          setSaveState(
            errorMessage
              ? `Taslak kaydedilemedi: ${errorMessage}`
              : "Taslak kaydedilemedi",
          );
        }
        return null;
      } finally {
        if (isCurrentEpoch(operationEpoch)) {
          setPendingSaveCount((count) => Math.max(0, count - 1));
        }
      }
    },
    [commitServerSnapshot, isCurrentEpoch, updateDraftMutation],
  );

  const enqueuePersist = useCallback(
    (
      snapshot: SpeakingV2AdminView,
      version: number,
      reportError: boolean,
      force = false,
      operationEpoch = draftEpochRef.current,
      allowUnmountedStart = false,
    ) => {
      const run = async () => {
        if (
          operationEpoch !== draftEpochRef.current ||
          (unmountedRef.current && !allowUnmountedStart) ||
          discardingRef.current
        ) {
          return null;
        }
        if (!force && version <= persistedVersionRef.current) {
          return latestServerRef.current;
        }
        return persistSnapshot(
          snapshot,
          version,
          reportError,
          operationEpoch,
          allowUnmountedStart,
        );
      };
      const queued = saveQueueRef.current.then(run, run);
      saveQueueRef.current = queued.then(
        () => null,
        () => null,
      );
      return queued;
    },
    [persistSnapshot],
  );

  const updateDraft = useCallback(
    (
      updater: (current: SpeakingV2AdminView) => SpeakingV2AdminView,
      allowWhilePublishing = false,
    ) => {
      const current = draftRef.current;
      if (
        !current ||
        (publishingRef.current && !allowWhilePublishing) ||
        discardingRef.current ||
        unmountedRef.current
      ) {
        return;
      }
      const next = updater(current);
      draftRef.current = next;
      localVersionRef.current += 1;
      dirtyRef.current = true;
      setDraft(next);
      setIsDirty(true);
      setSaveState("Kaydedilmemiş değişiklikler");
    },
    [],
  );

  const registerImageUpload = useCallback(
    (start: (isCurrent: () => boolean) => Promise<void>) => {
      if (
        unmountedRef.current ||
        publishingRef.current ||
        discardingRef.current
      ) {
        return;
      }
      const operation: PendingImageUpload = {
        epoch: draftEpochRef.current,
        token: Symbol("speaking-image-upload"),
        promise: Promise.resolve(),
      };
      const isCurrent = () =>
        isCurrentEpoch(operation.epoch) &&
        pendingImageUploadsRef.current.get(operation.token) === operation;
      pendingImageUploadsRef.current.set(operation.token, operation);
      setPendingImageUploadCount(pendingImageUploadsRef.current.size);

      operation.promise = Promise.resolve().then(() => start(isCurrent));
      const finish = () => {
        if (!isCurrent()) return;
        pendingImageUploadsRef.current.delete(operation.token);
        setPendingImageUploadCount(pendingImageUploadsRef.current.size);
      };
      void operation.promise.then(finish, finish);
    },
    [isCurrentEpoch],
  );

  const waitForPendingImageUploads = useCallback(
    async (operationEpoch: number) => {
      while (
        isCurrentEpoch(operationEpoch) &&
        pendingImageUploadsRef.current.size > 0
      ) {
        await Promise.allSettled(
          [...pendingImageUploadsRef.current.values()]
            .filter((operation) => operation.epoch === operationEpoch)
            .map((operation) => operation.promise),
        );
      }
      return isCurrentEpoch(operationEpoch);
    },
    [isCurrentEpoch],
  );

  const saveDraft = useCallback(
    async (operationEpoch = draftEpochRef.current) => {
      if (
        !isCurrentEpoch(operationEpoch) ||
        discardingRef.current
      ) {
        return null;
      }
      const snapshot = draftRef.current;
      if (!snapshot) return null;
      return enqueuePersist(
        snapshot,
        localVersionRef.current,
        true,
        true,
        operationEpoch,
      );
    },
    [enqueuePersist, isCurrentEpoch],
  );

  useEffect(() => {
    if (data && isSpeakingV2(data)) applyServerSnapshot(data);
  }, [applyServerSnapshot, data]);

  useEffect(() => {
    if (!draft || !isDirty || publishingFlow || discarding) return undefined;
    const version = localVersionRef.current;
    const operationEpoch = draftEpochRef.current;
    if (version <= persistedVersionRef.current) return undefined;
    if (queuedAutosaveVersionRef.current === version) return undefined;
    const timer = window.setTimeout(() => {
      if (
        !isCurrentEpoch(operationEpoch) ||
        discardingRef.current ||
        !dirtyRef.current ||
        version !== localVersionRef.current ||
        queuedAutosaveVersionRef.current === version
      ) {
        return;
      }
      queuedAutosaveVersionRef.current = version;
      void enqueuePersist(
        draftRef.current ?? draft,
        version,
        false,
        false,
        operationEpoch,
      ).finally(() => {
        if (
          isCurrentEpoch(operationEpoch) &&
          queuedAutosaveVersionRef.current === version
        ) {
          queuedAutosaveVersionRef.current = null;
        }
      });
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    discarding,
    draft,
    enqueuePersist,
    isCurrentEpoch,
    isDirty,
    publishingFlow,
  ]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (
        !dirtyRef.current &&
        pendingImageUploadsRef.current.size === 0
      ) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, []);

  useEffect(() => {
    flushOnExitRef.current = () => {
      const snapshot = draftRef.current;
      const version = localVersionRef.current;
      if (!snapshot || !dirtyRef.current) return;
      if (queuedAutosaveVersionRef.current === version) return;
      void enqueuePersist(
        snapshot,
        version,
        false,
        false,
        draftEpochRef.current,
        true,
      );
    };
  }, [enqueuePersist]);

  useEffect(() => {
    const generatingOperations = generatingKeysRef.current;
    const pendingImageUploads = pendingImageUploadsRef.current;
    unmountedRef.current = false;
    return () => {
      flushOnExitRef.current();
      unmountedRef.current = true;
      generatingOperations.clear();
      pendingImageUploads.clear();
      publicationOperationRef.current = null;
      revisionOperationRef.current = null;
    };
  }, []);

  const discardLocalAndOpenLatest = useCallback(async () => {
    if (discardingRef.current || unmountedRef.current) return;
    const operationEpoch = draftEpochRef.current + 1;
    draftEpochRef.current = operationEpoch;
    discardingRef.current = true;

    queuedAutosaveVersionRef.current = null;
    saveQueueRef.current = Promise.resolve(null);
    generatingKeysRef.current.clear();
    pendingImageUploadsRef.current.clear();
    publicationOperationRef.current = null;
    revisionOperationRef.current = null;
    publishingRef.current = false;
    update.reset?.();
    publish.reset?.();
    generateAudio.reset?.();
    deleteAudio.reset?.();
    revise.reset?.();

    setDiscarding(true);
    setGeneratingKeys(new Set());
    setPendingImageUploadCount(0);
    setPendingSaveCount(0);
    setPublishingFlow(false);
    setRevising(false);
    setAudioProgress({ completed: 0, total: 0 });
    setSaveState("Son sunucu sürümü alınıyor");

    try {
      const result = await refetch({ cancelRefetch: true });
      if (!isCurrentEpoch(operationEpoch)) return;
      if ("isError" in result && result.isError) {
        throw result.error;
      }
      const fresh = result.data;
      if (!fresh || !isSpeakingV2(fresh)) {
        throw new Error("Fresh speaking V2 draft was not returned");
      }

      const applied = applyServerSnapshot(fresh, undefined, true);
      if (!applied.accepted) {
        throw new Error("Fresh speaking V2 draft was older than accepted data");
      }
      dirtyRef.current = false;
      localVersionRef.current = 0;
      persistedVersionRef.current = 0;
      queryClient.setQueryData(speakingV2Keys.detail(id), applied.snapshot);
      void queryClient.invalidateQueries({ queryKey: speakingV2ListKey });

      setIsDirty(false);
      setConflictOpen(false);
      setSaveState("Sunucudaki sürüm açıldı");
    } catch {
      if (!isCurrentEpoch(operationEpoch)) return;
      setSaveState("Son sunucu sürümü alınamadı");
      message.error(
        "Son sunucu sürümü alınamadı. Yerel değişiklikleriniz korunuyor.",
      );
    } finally {
      if (isCurrentEpoch(operationEpoch)) {
        discardingRef.current = false;
        setDiscarding(false);
      }
    }
  }, [
    applyServerSnapshot,
    deleteAudio,
    generateAudio,
    id,
    isCurrentEpoch,
    publish,
    queryClient,
    refetch,
    revise,
    update,
  ]);

  const focusIssues = (nextIssues: SpeakingReadinessIssue[]) => {
    setIssues(nextIssues);
    const firstTaskIssue = nextIssues.find((issue) => issue.taskCode !== "TEST");
    if (firstTaskIssue && firstTaskIssue.taskCode !== "TEST") {
      setActiveTask(firstTaskIssue.taskCode);
    }
  };

  const generatePromptAudio = useCallback(
    async (
      testId: string,
      key: SpeakingV2PromptKey,
      requestVersion: number,
      operationEpoch: number,
    ) => {
      if (
        !isCurrentEpoch(operationEpoch) ||
        generatingKeysRef.current.has(key)
      ) {
        return null;
      }
      const operation: EpochOperation = {
        epoch: operationEpoch,
        token: Symbol(`speaking-audio-${key}`),
      };
      const isCurrent = () =>
        isCurrentEpoch(operation.epoch) &&
        generatingKeysRef.current.get(key) === operation;
      generatingKeysRef.current.set(key, operation);
      setGeneratingKeys((current) => new Set(current).add(key));
      try {
        const generated = await generateAudio.mutateAsync({ id: testId, key });
        if (!isCurrent()) return null;
        return commitServerSnapshot(
          generated,
          requestVersion,
          operationEpoch,
        );
      } catch (error) {
        if (!isCurrent()) return null;
        throw error;
      } finally {
        if (isCurrent()) {
          generatingKeysRef.current.delete(key);
          setGeneratingKeys((current) => {
            const next = new Set(current);
            next.delete(key);
            return next;
          });
        }
      }
    },
    [commitServerSnapshot, generateAudio, isCurrentEpoch],
  );

  const retryPromptAudio = async (key: SpeakingV2PromptKey) => {
    if (generatingKeysRef.current.has(key)) return;
    const operationEpoch = draftEpochRef.current;
    const requestVersion = localVersionRef.current;
    const saved = await saveDraft(operationEpoch);
    if (!saved || !isCurrentEpoch(operationEpoch)) return;
    const item = saved.audioItems.find((candidate) => candidate.key === key);

    try {
      const generated = await generatePromptAudio(
        saved.id,
        key,
        requestVersion,
        operationEpoch,
      );
      if (!generated || !isCurrentEpoch(operationEpoch)) return;
      setIssues([]);
      setSaveState("Ses durumu güncellendi");
    } catch {
      if (!isCurrentEpoch(operationEpoch)) return;
      const taskCode = item?.taskCode ?? "TEST";
      const nextIssues: SpeakingReadinessIssue[] = [
        {
          taskCode,
          field: `audio.${key}`,
          message:
            "Soru sesi hazırlanamadı. Metinleriniz kaydedildi; yeniden deneyin.",
        },
      ];
      focusIssues(nextIssues);
    }
  };

  const deletePromptAudio = async (key: SpeakingV2PromptKey) => {
    if (generatingKeysRef.current.has(key)) return;
    const operationEpoch = draftEpochRef.current;
    const requestVersion = localVersionRef.current;
    const saved = await saveDraft(operationEpoch);
    if (!saved || !isCurrentEpoch(operationEpoch)) return;

    const operation: EpochOperation = {
      epoch: operationEpoch,
      token: Symbol(`speaking-audio-delete-${key}`),
    };
    const isCurrent = () =>
      isCurrentEpoch(operation.epoch) &&
      generatingKeysRef.current.get(key) === operation;
    generatingKeysRef.current.set(key, operation);
    setGeneratingKeys((current) => new Set(current).add(key));

    try {
      const updated = await deleteAudio.mutateAsync({ id: saved.id, key });
      if (!isCurrent()) return;
      commitServerSnapshot(updated, requestVersion, operationEpoch);
      setIssues([]);
      setSaveState("Ses silindi");
    } catch {
      if (!isCurrent()) return;
      message.error("Soru sesi silinemedi. Yeniden deneyin.");
    } finally {
      if (isCurrent()) {
        generatingKeysRef.current.delete(key);
        setGeneratingKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    }
  };

  const publishDraft = async () => {
    if (publicationOperationRef.current || discardingRef.current) return;
    const operation: EpochOperation = {
      epoch: draftEpochRef.current,
      token: Symbol("speaking-publication"),
    };
    const isCurrent = () =>
      isCurrentEpoch(operation.epoch) &&
      publicationOperationRef.current === operation;
    publicationOperationRef.current = operation;
    publishingRef.current = true;
    setPublishingFlow(true);
    try {
      const uploadsCompleted = await waitForPendingImageUploads(operation.epoch);
      if (!uploadsCompleted || !isCurrent()) return;
      const publicationVersion = localVersionRef.current;
      const saved = await saveDraft(operation.epoch);
      if (!saved || !isCurrent()) return;
      const contentIssues = saved.readiness.issues.filter(
        (issue) => !issue.field.startsWith("audio."),
      );
      if (contentIssues.length > 0) {
        focusIssues(contentIssues);
        setAudioProgress({ completed: 0, total: 0 });
        return;
      }
      await checkSpeakingV2Publication(saved.id);
      if (!isCurrent()) return;
      const requiredAudioItems = saved.audioItems.filter((item) =>
        REQUIRED_PROMPT_AUDIO_KEYS.has(item.key),
      );
      const required = requiredAudioItems.filter(
        (item) => item.status !== "READY",
      );
      const totalAudio = requiredAudioItems.length;
      const alreadyReady = totalAudio - required.length;
      setAudioProgress({ completed: alreadyReady, total: totalAudio });

      for (const [index, item] of required.entries()) {
        try {
          const generated = await generatePromptAudio(
            saved.id,
            item.key,
            publicationVersion,
            operation.epoch,
          );
          if (!generated || !isCurrent()) return;
          setAudioProgress({
            completed: alreadyReady + index + 1,
            total: totalAudio,
          });
        } catch {
          if (!isCurrent()) return;
          focusIssues([
            {
              taskCode: item.taskCode,
              field: `audio.${item.key}`,
              message: "Soru sesi hazırlanamadı. Bu görevde yeniden deneyin.",
            },
          ]);
          return;
        }
      }

      const published = await publish.mutateAsync(saved.id);
      if (!isCurrent()) return;
      commitServerSnapshot(
        published,
        publicationVersion,
        operation.epoch,
      );
      setIssues([]);
      setSaveState("Yayımlandı");
    } catch (error) {
      if (!isCurrent()) return;
      const nextIssues = publicationIssues(error);
      focusIssues(
        nextIssues.length
          ? nextIssues
          : [
              {
                taskCode: "TEST",
                field: "publish",
                message:
                  "Sınav yayımlanamadı. Girdileriniz kaydedildi; yeniden deneyin.",
              },
          ],
      );
    } finally {
      if (isCurrent()) {
        publicationOperationRef.current = null;
        publishingRef.current = false;
        setPublishingFlow(false);
      }
    }
  };

  const reviseDraft = async () => {
    const current = draftRef.current;
    if (
      !current ||
      revisionOperationRef.current ||
      discardingRef.current ||
      unmountedRef.current
    ) {
      return;
    }
    const operation: EpochOperation = {
      epoch: draftEpochRef.current,
      token: Symbol("speaking-revision"),
    };
    const isCurrent = () =>
      isCurrentEpoch(operation.epoch) &&
      revisionOperationRef.current === operation;
    revisionOperationRef.current = operation;
    setRevising(true);
    try {
      const created = await revise.mutateAsync(current.id);
      if (!isCurrent()) return;
      queryClient.setQueryData(speakingV2Keys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: speakingV2ListKey });
      if (!isCurrent()) return;
      navigate(`/speaking/${created.id}/edit`);
    } catch {
      if (!isCurrent()) return;
      message.error("Yeni sürüm oluşturulamadı. Yeniden deneyin.");
    } finally {
      if (isCurrent()) {
        revisionOperationRef.current = null;
        setRevising(false);
      }
    }
  };

  if (isLoading) return <Skeleton active />;
  if (data && !isSpeakingV2(data)) return <LegacyArchive data={data} />;
  if (!draft) return <Result status="404" title="Konuşma sınavı bulunamadı" />;

  const readOnly =
    draft.status === "ARCHIVED" ||
    (draft.status === "PUBLISHED" &&
      (draft.submissionCount > 0 || (draft.activeAttemptCount ?? 0) > 0));
  const completion = getSpeakingV2Completion(draft);

  return (
    <main className="speaking-v2-editor">
      <EditorHeader
        draft={draft}
        readOnly={readOnly}
        editingLocked={publishingFlow || discarding || revising}
        saving={
          update.isPending ||
          pendingSaveCount > 0 ||
          pendingImageUploadCount > 0
        }
        publishing={publish.isPending || publishingFlow}
        revising={revising}
        saveState={saveState}
        onIdentityChange={(identity) =>
          updateDraft((current) => ({ ...current, ...identity }))
        }
        onSave={saveDraft}
        onPublish={publishDraft}
        onRevise={reviseDraft}
      />
      {draft.status === "PUBLISHED" && (draft.activeAttemptCount ?? 0) > 0 && (
        <Alert
          type="info"
          showIcon
          message="Bu sınavda devam eden bir öğrenci oturumu var. Mevcut sınav korunur; değişiklik yapmak için yeni sürüm oluşturun."
        />
      )}
      {audioProgress.total > 0 && (
        <Progress
          aria-label="Soru sesleri hazırlanıyor"
          percent={Math.round(
            (audioProgress.completed / audioProgress.total) * 100,
          )}
          format={() => `Hazırlanan ses: ${audioProgress.completed}/${audioProgress.total}`}
        />
      )}
      {issues
        .filter((issue) => issue.taskCode === "TEST")
        .map((issue) => (
          <Alert
            key={`${issue.field}-${issue.message}`}
            type="error"
            message={issue.message}
            showIcon
          />
        ))}
      <Tabs
        activeKey={activeTask}
        onChange={(key) => setActiveTask(key as SpeakingTaskCode)}
        destroyOnHidden
        items={TASK_TABS.map((tab) => ({
          key: tab.key,
          label: (
            <TaskTabLabel label={tab.label} complete={completion[tab.key]} />
          ),
          children: (
            <TaskEditor
              taskCode={tab.key}
              draft={draft}
              readOnly={readOnly}
              editingLocked={publishingFlow || discarding || revising}
              issues={issues.filter((issue) => issue.taskCode === tab.key)}
              onChange={updateDraft}
              onImageUploadStart={registerImageUpload}
              onRetryAudio={retryPromptAudio}
              onDeleteAudio={deletePromptAudio}
              pendingKeys={generatingKeys}
            />
          ),
        }))}
      />
      <Modal
        open={conflictOpen}
        getContainer={false}
        title="Daha yeni bir sürüm var"
        okText="Son sürümü aç"
        cancelText="İptal"
        confirmLoading={discarding}
        closable={!discarding}
        maskClosable={!discarding}
        cancelButtonProps={{ disabled: discarding }}
        onCancel={() => {
          if (!discarding) setConflictOpen(false);
        }}
        onOk={discardLocalAndOpenLatest}
      >
        Bu taslak başka bir sekmede güncellendi. Son sürümü açmak için sayfayı yenileyin.
      </Modal>
    </main>
  );
}
