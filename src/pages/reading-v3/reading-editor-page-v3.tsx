import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCreateReadingTestWithAddition } from "@/config/queries/reading/create.queries";
import { useGetReadingTestWithAddition } from "@/config/queries/reading/get-one.queries";
import { useUpdateReadingTestWithAddition } from "@/config/queries/reading/update.queries";
import { usePublishMockTest } from "@/config/queries/test/publication.queries";
import { readingAuthoringErrorCode, useReviseReadingTest } from "@/config/queries/reading/authoring.queries";
import { ReadingExamEditorV3 } from "./reading-exam-editor";
import {
  createOfficialReadingDraft,
  hydrateOfficialReadingDraft,
  serializeOfficialReadingDraft,
  type OfficialReadingDraft,
} from "./reading-editor-model";

type RouteState = {
  isNew?: boolean;
  testData?: {
    title?: string;
    ieltsId?: string;
  };
};

const unwrapTest = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { data?: unknown; id?: string };
  if (candidate.data && typeof candidate.data === "object") {
    return candidate.data as Record<string, unknown>;
  }
  return candidate as Record<string, unknown>;
};

export default function ReadingEditorPageV3() {
  const { ieltsId: routeId = "" } = useParams<{ ieltsId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as RouteState | null) ?? null;
  const isNew =
    Boolean(state?.isNew) || location.pathname.includes("/reading/new/");
  const testId = isNew ? "" : routeId;
  const groupId = isNew ? state?.testData?.ieltsId || routeId : "";
  const persistedIdRef = useRef(testId);
  const editorState = useRef({ dirty: false, busy: false });
  const [editorProtection, setEditorProtection] = useState(editorState.current);
  const allowSavedNavigation = useRef(false);
  const [requiresRevision, setRequiresRevision] = useState(false);
  const blocker = useBlocker(() =>
    !allowSavedNavigation.current && (editorState.current.dirty || editorState.current.busy),
  );
  const onEditorStateChange = useCallback((next: { dirty: boolean; busy: boolean }) => {
    editorState.current = next;
    setEditorProtection(next);
  }, []);
  const navigateAfterSave = (path: string) => {
    allowSavedNavigation.current = true;
    void navigate(path, { replace: true });
    allowSavedNavigation.current = false;
  };

  useEffect(() => {
    if (testId) persistedIdRef.current = testId;
    setRequiresRevision(false);
  }, [testId]);

  const query = useGetReadingTestWithAddition(testId);
  const createMutation = useCreateReadingTestWithAddition();
  const updateMutation = useUpdateReadingTestWithAddition();
  const publishMutation = usePublishMockTest();
  const reviseMutation = useReviseReadingTest();

  const initialDraft = useMemo(() => {
    const fetched = unwrapTest(query.data);
    if (!isNew && fetched) {
      return hydrateOfficialReadingDraft(fetched, groupId);
    }
    return createOfficialReadingDraft({
      ieltsId: groupId,
      title: state?.testData?.title ?? "",
    });
  }, [groupId, isNew, query.data, state?.testData?.title]);

  if (!routeId) {
    return (
      <div className="p-8 text-sm text-neutral-700">
        Test grubu bulunamadı. Okuma testleri sayfasına dönün.
      </div>
    );
  }

  if (!isNew && query.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-600">
        Okuma testi yükleniyor...
      </div>
    );
  }

  if (!isNew && query.isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-semibold text-neutral-900">Okuma testi açılamadı.</p>
        <button
          type="button"
          onClick={() => navigate("/reading")}
          className="h-9 rounded-md border border-neutral-200 bg-white px-4 text-xs font-semibold"
        >
          Okuma testlerine dön
        </button>
      </div>
    );
  }

  const saveDraft = async (draft: OfficialReadingDraft) => {
    const payload = serializeOfficialReadingDraft(draft);
    const persistedId = persistedIdRef.current || testId;

    if (persistedId) {
      const updatePayload = { ...payload } as Record<string, unknown>;
      delete updatePayload.ieltsId;
      let response: unknown;
      try {
        response = await updateMutation.mutateAsync({
          id: persistedId,
          ...updatePayload,
          expectedContentRevision: draft.contentRevision,
        });
      } catch (error) {
        const code = readingAuthoringErrorCode(error);
        if (code === "MOCK_PUBLISHED_TEST_IN_USE") setRequiresRevision(true);
        if (code === "MOCK_CONTENT_REVISION_CONFLICT") {
          toast.error("Bu taslak başka bir yerde değiştirildi. Değişikliklerinizi koruyun ve güncel sürümü yeniden açın.");
        }
        throw error;
      }
      const saved = unwrapTest(response);
      if (!saved?.id) throw new Error("Saved reading test is missing its id");
      toast.success("Taslak kaydedildi");
      return hydrateOfficialReadingDraft(saved, draft.ieltsId);
    }

    const response = await createMutation.mutateAsync(payload);
    const createdId = String(unwrapTest(response)?.id || "");
    if (createdId) {
      persistedIdRef.current = createdId;
      toast.success("Taslak kaydedildi");
      const saved = hydrateOfficialReadingDraft(unwrapTest(response)!, draft.ieltsId);
      navigateAfterSave(`/reading/${createdId}/edit-v3`);
      return saved;
    }
    throw new Error("Created reading test is missing its id");
  };

  const publishDraft = testId
    ? async (draft: OfficialReadingDraft) => {
        await publishMutation.mutateAsync(draft.testId || testId);
        navigateAfterSave("/reading");
      }
    : undefined;

  const reviseDraft = testId ? async (draft: OfficialReadingDraft) => {
    const payload = serializeOfficialReadingDraft(draft);
    const response = await reviseMutation.mutateAsync({
      id: persistedIdRef.current || testId,
      ...payload,
      expectedContentRevision: draft.contentRevision,
    });
    const revised = unwrapTest(response);
    if (!revised?.id) throw new Error("Reading revision is missing its id");
    const saved = hydrateOfficialReadingDraft(revised, draft.ieltsId);
    persistedIdRef.current = String(revised.id);
    setRequiresRevision(false);
    navigateAfterSave(`/reading/${revised.id}/edit-v3`);
    return saved;
  } : undefined;

  return (<>
    <ReadingExamEditorV3
      initialDraft={initialDraft}
      onBack={() => navigate("/reading")}
      onSave={saveDraft}
      onPublish={publishDraft}
      onRevise={reviseDraft}
      requiresRevision={requiresRevision}
      onStateChange={onEditorStateChange}
      isSaving={createMutation.isPending || updateMutation.isPending || reviseMutation.isPending}
      isPublishing={publishMutation.isPending}
    />
    {blocker.state === "blocked" ? (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="reading-leave-title" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
          <h2 id="reading-leave-title" className="font-semibold">Sayfadan ayrılmak istiyor musunuz?</h2>
          <p className="mt-2 text-sm text-neutral-600">
            {editorProtection.busy ? "İşlem sürüyor. Tamamlanmasını bekleyin." : "Kaydedilmemiş değişiklikleriniz kaybolacak."}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => blocker.reset()} className="rounded-md border px-3 py-2 text-sm">Düzenlemeye devam et</button>
            <button type="button" disabled={editorProtection.busy} onClick={() => blocker.proceed()} className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50">Kaydetmeden ayrıl</button>
          </div>
        </div>
      </div>
    ) : null}
  </>);
}
