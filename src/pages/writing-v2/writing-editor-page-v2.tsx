import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Segmented,
  Select,
  Spin,
  Tabs,
  Tag,
} from "antd";
import { Archive, ArrowLeft, CheckCircle2, Clock3, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";

import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";
import {
  isWritingPublishedTestInUseError,
  useArchiveWritingTestV2,
  useGetWritingTestV2,
  usePublishWritingTestV2,
  useReviseWritingTestV2,
  useUpdateWritingTestV2,
} from "@/config/queries/writing/v2.queries";

import {
  EMPTY_RICH_TEXT_DOCUMENT,
  WRITING_TASK_DEFINITIONS,
  type RichTextDocument,
  type WritingTaskCode,
  type WritingTaskV2Payload,
  type WritingTestV2,
  type WritingTestV2Payload,
} from "./types";
import WritingRichTextEditor from "./writing-rich-text-editor";

type WritingPartTab = "PART_1" | "PART_2";
type PartOneTaskCode = "TASK_1_1" | "TASK_1_2";

const copyDocument = (value?: RichTextDocument | null): RichTextDocument =>
  value
    ? JSON.parse(JSON.stringify(value))
    : JSON.parse(JSON.stringify(EMPTY_RICH_TEXT_DOCUMENT));

const normalizeLegacyTaskMetadata = (
  taskCode: WritingTaskCode,
  field: "register" | "genre",
  value: string | null | undefined,
  fallback: string,
) => {
  const current = value?.trim();
  if (!current) return fallback;

  if (taskCode === "TASK_1_1" && field === "register" && current === "Samimi") {
    return fallback;
  }
  if (
    (taskCode === "TASK_1_1" || taskCode === "TASK_1_2") &&
    field === "genre" &&
    current === "E-posta"
  ) {
    return fallback;
  }
  return current;
};

const createPayload = (test: WritingTestV2): WritingTestV2Payload => {
  const subParts = (test.sections || []).flatMap(
    (section) => section.subParts || [],
  );

  return {
    ieltsId: test.ieltsId,
    title: test.title || "",
    instruction: test.instruction || "",
    sourceEmail: copyDocument(test.sourceEmail),
    durationMinutes: test.durationMinutes || 60,
    tasks: WRITING_TASK_DEFINITIONS.map((definition) => {
      const existing = subParts.find(
        (subPart) => subPart.taskCode === definition.taskCode,
      );
      const existingPrompt = copyDocument(existing?.promptJson);
      return {
        taskCode: definition.taskCode,
        promptJson: existingPrompt,
        register: normalizeLegacyTaskMetadata(
          definition.taskCode,
          "register",
          existing?.register,
          definition.register,
        ),
        genre: normalizeLegacyTaskMetadata(
          definition.taskCode,
          "genre",
          existing?.genre,
          definition.genre,
        ),
        targetLevel: existing?.targetLevel || definition.targetLevel,
        wordMin: existing?.wordMin ?? definition.wordMin,
        wordMax: existing?.wordMax ?? definition.wordMax,
        maxRawScore: definition.maxRawScore,
      };
    }),
  };
};

const statusLabel = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv",
} as const;

const statusColor = {
  DRAFT: "default",
  PUBLISHED: "green",
  ARCHIVED: "gold",
} as const;

export default function WritingEditorPageV2() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const hydratedId = useRef<string | null>(null);
  const operationInFlight = useRef(false);
  const allowSavedNavigation = useRef(false);
  const [operationPending, setOperationPending] = useState(false);
  const [activePart, setActivePart] = useState<WritingPartTab>("PART_1");
  const [activePartOneTask, setActivePartOneTask] =
    useState<PartOneTaskCode>("TASK_1_1");
  const [payload, setPayload] = useState<WritingTestV2Payload | null>(null);
  const [dirty, setDirty] = useState(false);
  const [archiveRequested, setArchiveRequested] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState<{
    publishAfterRevision: boolean;
  } | null>(null);

  const { data: test, isLoading, error } = useGetWritingTestV2(id);
  const { data: ieltsData, isLoading: isIeltsLoading } = useGetAllIelts();
  const updateMutation = useUpdateWritingTestV2();
  const reviseMutation = useReviseWritingTestV2();
  const publishMutation = usePublishWritingTestV2();
  const archiveMutation = useArchiveWritingTestV2();
  const readOnly = test?.status === "ARCHIVED";
  const busy =
    operationPending ||
    updateMutation.isPending ||
    reviseMutation.isPending ||
    publishMutation.isPending ||
    archiveMutation.isPending;
  const editingDisabled = readOnly || busy;
  const blocker = useBlocker(
    () => !allowSavedNavigation.current && (dirty || busy || operationInFlight.current),
  );

  const navigateAfterSave = (path: string) => {
    // This navigation preserves the saved draft, including a newly created revision.
    allowSavedNavigation.current = true;
    void navigate(path, { replace: true });
    allowSavedNavigation.current = false;
  };

  useEffect(() => {
    if (!test || hydratedId.current === test.id) return;
    hydratedId.current = test.id;
    setPayload(createPayload(test));
    setDirty(false);
  }, [test]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty && !busy) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty, busy]);

  const ieltsOptions = useMemo(
    () =>
      (ieltsData?.ieltsData || []).map((ielts) => ({
        label: ielts.title,
        value: ielts.id,
      })),
    [ieltsData],
  );

  const setField = <K extends keyof WritingTestV2Payload>(
    field: K,
    value: WritingTestV2Payload[K],
  ) => {
    if (readOnly || operationInFlight.current) return;
    setPayload((current) => (current ? { ...current, [field]: value } : null));
    setDirty(true);
  };

  const updateTask = (
    taskCode: WritingTaskCode,
    patch: Partial<WritingTaskV2Payload>,
  ) => {
    if (readOnly || operationInFlight.current) return;
    setPayload((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) =>
              task.taskCode === taskCode ? { ...task, ...patch } : task,
            ),
          }
        : null,
    );
    setDirty(true);
  };

  const openSavedTest = (saved: WritingTestV2) => {
    hydratedId.current = saved.id;
    setPayload(createPayload(saved));
    setDirty(false);
    if (saved.id !== id) {
      navigateAfterSave(`/writing/${saved.id}/edit-v2`);
    }
  };

  const confirmRevision = (publishAfterRevision: boolean) => {
    if (!payload) return;
    setRevisionRequest({ publishAfterRevision });
  };

  const createRevision = async () => {
    if (!payload || !revisionRequest || operationInFlight.current) return;
    operationInFlight.current = true;
    setOperationPending(true);
    try {
      const revised = await reviseMutation.mutateAsync({ id, data: payload });
      openSavedTest(revised);
      setRevisionRequest(null);

      if (revisionRequest.publishAfterRevision) {
        const published = await publishMutation.mutateAsync(revised.id);
        openSavedTest(published);
      }
    } catch {
      // Mutation hooks display the error. Keep edits, or the saved new draft,
      // available for another attempt when revision or publication fails.
    } finally {
      operationInFlight.current = false;
      setOperationPending(false);
    }
  };

  const persist = async (publishAfterSave: boolean) => {
    if (!payload || readOnly || operationInFlight.current) return;
    operationInFlight.current = true;
    setOperationPending(true);

    let revisionPromptOpened = false;

    try {
      const saved = await updateMutation.mutateAsync({
        id,
        data: payload,
        onPublishedTestInUse: () => {
          revisionPromptOpened = true;
          confirmRevision(publishAfterSave);
        },
      });
      openSavedTest(saved);
      if (publishAfterSave) {
        const published = await publishMutation.mutateAsync(saved.id);
        openSavedTest(published);
      }
    } catch (error) {
      if (!revisionPromptOpened && isWritingPublishedTestInUseError(error)) {
        confirmRevision(publishAfterSave);
      }
    } finally {
      operationInFlight.current = false;
      setOperationPending(false);
    }
  };

  const save = () => persist(false);
  const publish = () => persist(true);

  const archive = async () => {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    setOperationPending(true);
    try {
      await archiveMutation.mutateAsync(id);
      setArchiveRequested(false);
      navigateAfterSave("/writing");
    } catch {
      // The mutation reports the error; keep the draft and confirmation open.
    } finally {
      operationInFlight.current = false;
      setOperationPending(false);
    }
  };

  if (isLoading || !payload || !test) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Yazma testi açılamadı."
            description="Test silinmiş veya erişim dışı olabilir."
          />
        ) : (
          <Spin size="large" />
        )}
      </div>
    );
  }

  if (test.formatVersion !== 2) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Alert
          type="info"
          showIcon
          message="Bu test eski yazma formatındadır."
          description="Eski testler arşivde salt okunur tutulur. Yeni öğrencilere yalnızca Yazma V2 testleri sunulur."
          action={
            <Button onClick={() => navigate("/writing")}>Listeye dön</Button>
          }
        />
      </div>
    );
  }

  const activePartOneDefinition = WRITING_TASK_DEFINITIONS.find(
    (definition) => definition.taskCode === activePartOneTask,
  )!;
  const activePartOnePayload = payload.tasks.find(
    (task) => task.taskCode === activePartOneTask,
  )!;
  const taskTwoPayload = payload.tasks.find(
    (task) => task.taskCode === "TASK_2",
  )!;

  return (
    <>
      <main className="mx-auto w-full max-w-[1240px] space-y-5 pb-16">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              aria-label="Yazma testlerine dön"
              icon={<ArrowLeft size={17} />}
              onClick={() => navigate("/writing")}
            />
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="m-0 truncate text-2xl font-semibold text-neutral-900">
                  Yazma sınavı
                </h1>
                <Tag color={statusColor[test.status]}>
                  {statusLabel[test.status]}
                </Tag>
                {dirty ? (
                  <Tag color="orange">Kaydedilmemiş değişiklik</Tag>
                ) : null}
              </div>
              <p className="m-0 text-sm text-neutral-500">
                İki bölüm, üç sabit görev ve 60 dakikalık süre
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly ? (
              <>
                <Button
                  icon={<Save size={16} />}
                  loading={
                    updateMutation.isPending ||
                    (reviseMutation.isPending && !publishMutation.isPending)
                  }
                  disabled={busy}
                  onClick={save}
                >
                  Taslağı kaydet
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={16} />}
                  loading={
                    publishMutation.isPending || reviseMutation.isPending
                  }
                  disabled={busy}
                  onClick={publish}
                >
                  Yayınla
                </Button>
                <Button
                  danger
                  icon={<Archive size={16} />}
                  disabled={busy}
                  onClick={() => setArchiveRequested(true)}
                >
                  Arşivle
                </Button>
              </>
            ) : null}
          </div>
        </header>

        {readOnly ? (
          <Alert
            type="warning"
            showIcon
            message="Bu test arşivde ve salt okunurdur."
            description="Geçmiş sonuçlar korunur; yeni sınav için yeni bir V2 taslağı oluşturun."
          />
        ) : null}

        <Card styles={{ body: { padding: 22 } }}>
          <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_320px_auto]">
            <Field label="Test adı">
              <Input
                value={payload.title}
                disabled={editingDisabled}
                placeholder="Örneğin: Yazma Deneme 1"
                onChange={(event) => setField("title", event.target.value)}
              />
            </Field>
            <Field label="Bağlı sınav paketi">
              <Select
                className="w-full"
                value={payload.ieltsId}
                disabled={editingDisabled}
                loading={isIeltsLoading}
                options={ieltsOptions}
                showSearch
                optionFilterProp="label"
                onChange={(value) => setField("ieltsId", value)}
              />
            </Field>
            <div className="flex h-8 items-center gap-2 pb-px text-sm font-medium text-neutral-600">
              <Clock3 size={15} aria-hidden="true" />
              60 dakika
            </div>
          </div>
        </Card>

        <Card styles={{ body: { padding: 0 } }} className="overflow-hidden">
          <Tabs
            activeKey={activePart}
            onChange={(key) => setActivePart(key as WritingPartTab)}
            tabBarStyle={{ margin: 0, padding: "0 22px" }}
            items={[
              {
                key: "PART_1",
                label: <span className="py-1">Bölüm 1</span>,
                children: (
                  <div className="space-y-7 p-[22px]">
                    <div>
                      <h2 className="m-0 text-xl font-semibold text-neutral-900">
                        E-posta ve mektup görevleri
                      </h2>
                      <p className="mb-0 mt-1 text-sm leading-6 text-neutral-500">
                        Bağlam ve gelen e-posta iki görevde ortak gösterilir.
                      </p>
                    </div>

                    <Field label="E-posta öncesi bağlam">
                      <Input.TextArea
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        value={payload.instruction}
                        disabled={editingDisabled}
                        placeholder="Bir spor kulübünün üyesisiniz. Kulüp müdüründen bir e-posta aldınız:"
                        onChange={(event) =>
                          setField("instruction", event.target.value)
                        }
                      />
                    </Field>

                    <WritingRichTextEditor
                      label="Gelen e-posta"
                      value={payload.sourceEmail}
                      disabled={editingDisabled}
                      placeholder="Adayın yanıtlayacağı gelen e-postayı buraya yazın..."
                      minHeight={220}
                      onChange={(value) => setField("sourceEmail", value)}
                    />

                    <div className="border-t border-neutral-200 pt-6">
                      <Segmented
                        block
                        value={activePartOneTask}
                        options={[
                          { label: "Görev 1.1", value: "TASK_1_1" },
                          { label: "Görev 1.2", value: "TASK_1_2" },
                        ]}
                        onChange={(value) =>
                          setActivePartOneTask(value as PartOneTaskCode)
                        }
                      />

                      <div className="mt-6">
                        <div className="mb-4">
                          <h3 className="m-0 text-lg font-semibold text-neutral-900">
                            {activePartOneDefinition.label}
                          </h3>
                          <p className="mb-0 mt-1 text-sm text-neutral-500">
                            {activePartOneDefinition.genre} ·{" "}
                            {activePartOneDefinition.register} üslup ·{" "}
                            {activePartOneDefinition.wordMin ===
                            activePartOneDefinition.wordMax
                              ? `${activePartOneDefinition.wordMin} kelime`
                              : `${activePartOneDefinition.wordMin}-${activePartOneDefinition.wordMax} kelime`}
                          </p>
                        </div>

                        <WritingRichTextEditor
                          label="Adaydan istenenler"
                          value={activePartOnePayload.promptJson}
                          disabled={editingDisabled}
                          placeholder="Adayın bu görevde yazması gereken maddeleri girin..."
                          minHeight={220}
                          onChange={(value) =>
                            updateTask(activePartOneTask, { promptJson: value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "PART_2",
                label: <span className="py-1">Bölüm 2</span>,
                children: (
                  <div className="space-y-7 p-[22px]">
                    <div>
                      <h2 className="m-0 text-xl font-semibold text-neutral-900">
                        Tartışma konusu
                      </h2>
                      <p className="mb-0 mt-1 text-sm text-neutral-500">
                        Blog, forum veya dergi yazısı · 180-200 kelime
                      </p>
                    </div>

                    <WritingRichTextEditor
                      label="Bölüm 2 metni"
                      value={taskTwoPayload.promptJson}
                      disabled={editingDisabled}
                      allowBoxedBlock
                      minHeight={330}
                      placeholder={
                        "Bir tartışma platformunda şu soruya cevap veriyorsunuz:\n\n“Teknoloji eğitimde ne kadar kullanılmalı?”\n\nFikirlerinizi gerekçeler ve örneklerle destekleyerek yazınız.\n\n180-200 sözcükten oluşan bir yazı yazınız."
                      }
                      onChange={(value) =>
                        updateTask("TASK_2", { promptJson: value })
                      }
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </main>

      <Modal
        open={archiveRequested}
        title="Bu testi arşivlemek istiyor musunuz?"
        maskClosable={false}
        closable={!busy}
        keyboard={!busy}
        onCancel={() => {
          if (!operationInFlight.current) setArchiveRequested(false);
        }}
        okText="Arşivle"
        cancelText="Vazgeç"
        okButtonProps={{ danger: true, disabled: busy }}
        cancelButtonProps={{ disabled: busy }}
        confirmLoading={archiveMutation.isPending}
        onOk={() => void archive()}
      >
        {dirty ? "Kaydedilmemiş değişiklikleriniz kaybolacak. " : ""}
        Arşivlenen test yeni öğrencilere sunulmaz. Geçmiş öğrenci sonuçları korunur.
      </Modal>

      <Modal
        open={blocker.state === "blocked"}
        title="Sayfadan ayrılsın mı?"
        maskClosable={false}
        onCancel={() => blocker.state === "blocked" && blocker.reset()}
        cancelText="Düzenlemeye devam et"
        okText={dirty ? "Kaydetmeden ayrıl" : "Ayrıl"}
        okButtonProps={{ disabled: busy }}
        onOk={() => {
          if (!operationInFlight.current && blocker.state === "blocked") {
            blocker.proceed();
          }
        }}
      >
        {busy
          ? "İşlem tamamlanana kadar lütfen bekleyin."
          : dirty
            ? "Kaydedilmemiş değişiklikleriniz kaybolacak."
            : "Değişiklikleriniz kaydedildi."}
      </Modal>

      <Modal
        open={revisionRequest !== null}
        title="Yeni bir test sürümü oluşturulsun mu?"
        width={520}
        maskClosable={false}
        closable={!busy}
        keyboard={!busy}
        onCancel={() => {
          if (!operationInFlight.current) setRevisionRequest(null);
        }}
        footer={[
          <Button
            key="cancel"
            disabled={busy}
            onClick={() => setRevisionRequest(null)}
          >
            Vazgeç
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={reviseMutation.isPending || publishMutation.isPending}
            disabled={busy}
            onClick={() => void createRevision()}
          >
            {revisionRequest?.publishAfterRevision
              ? "Yeni sürümü yayınla"
              : "Yeni taslak oluştur"}
          </Button>,
        ]}
      >
        <p className="mb-0 leading-6 text-neutral-600">
          Yayımlanmış testin içeriği doğrudan değiştirilemez. Mevcut test ve geçmiş sonuçlar arşivde korunacak;
          yaptığınız değişikliklerle yeni bir sürüm oluşturulacak.
        </p>
      </Modal>
    </>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
        {label}
        {optional ? (
          <span className="text-xs font-normal text-neutral-400">
            isteğe bağlı
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
