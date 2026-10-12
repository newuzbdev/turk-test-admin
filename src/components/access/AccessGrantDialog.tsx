import {
  Alert,
  Button,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import {
  accessError,
  isAccessConflict,
  accessErrorCode,
  accessScopes,
  accessWrite,
  useRefreshAccess,
  type AccessPayload,
  type AccessRecord,
  type AccessTarget,
  type AccessScope,
  type LimitField,
} from "@/config/queries/access";
import { usePublishedAccessTargets } from "@/config/queries/students";
import { accessEndpoints } from "@/config/endpoint";
import AccessTimeWindow from "./AccessTimeWindow";
import { initialAccessWindow } from "@/utils/access-time";
import { relevantLimitFields, RequestIntent } from "./access-form-state";
import { currentAdminId } from "@/pages/students/student-live-query";
import { useSubscriptionAdminId } from "@/pages/students/student-subscription-query";
const scopeLabels: Record<AccessScope, string> = {
  PLATFORM: "Tam platform",
  MOCK_PACKAGE: "Deneme paketi",
  MOCK_READING: "Okuma Mock",
  MOCK_LISTENING: "Dinleme Mock",
  MOCK_WRITING: "Yazma Mock",
  MOCK_SPEAKING: "Konuşma Mock",
  PRACTICE_READING: "Okuma pratiği",
  PRACTICE_LISTENING: "Dinleme pratiği",
  PRACTICE_WRITING: "Yazma pratiği",
  PRACTICE_SPEAKING: "Konuşma pratiği",
};
const labels: Record<LimitField, string> = {
  writingMockLimit: "Yazma Mock hakkı",
  speakingMockLimit: "Konuşma Mock hakkı",
  practiceAiLimit: "AI pratik hakkı",
};
export type AccessGrantDialogProps = {
  userId?: string;
  target?: AccessTarget;
  record?: AccessRecord;
  kind?: "grant" | "public" | "share";
  onClose: () => void;
  onSaved?: () => void;
};
export default function AccessGrantDialog({
  userId,
  target,
  record,
  kind = "grant",
  onClose,
  onSaved,
}: AccessGrantDialogProps) {
  const adminId = useSubscriptionAdminId();
  const ownerAdminId = useRef(currentAdminId()).current;
  const [sessionExpired, setSessionExpired] = useState(false);
  const currentSession =
    !sessionExpired &&
    !!ownerAdminId &&
    adminId === ownerAdminId &&
    currentAdminId() === ownerAdminId;
  useEffect(() => {
    if (!ownerAdminId || adminId !== ownerAdminId) {
      setSessionExpired(true);
      onClose();
    }
  }, [adminId, ownerAdminId, onClose]);
  const requireOwner = () => {
    if (currentSession && currentAdminId() === ownerAdminId) return true;
    setSessionExpired(true);
    onClose();
    return false;
  };
  const [scope, setScope] = useState<AccessScope>(
    target?.scope ?? record?.scope ?? "PLATFORM",
  );
  const [targetId, setTargetId] = useState(
    target?.targetId ??
      (scope === record?.scope ? record?.targetId : undefined),
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const picker = usePublishedAccessTargets(
    scope,
    search,
    page,
    target?.targetId ??
      (!search && page === 1 && scope === record?.scope
        ? record?.targetId
        : undefined),
  );
  const [window, setWindow] = useState(
    record
      ? { startsAt: record.startsAt, endsAt: record.endsAt }
      : initialAccessWindow,
  );
  const [reason, setReason] = useState(record?.reason ?? "");
  const [limits, setLimits] = useState<Partial<Record<LimitField, number>>>(
    record ?? {},
  );
  const [windowValid, setWindowValid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [reloadReady, setReloadReady] = useState(false);
  const conflictRecord = useRef<{ revision?: number; code?: string }>({});
  const lock = useRef(false);
  const intent = useRef(new RequestIntent());
  const refresh = useRefreshAccess();
  useEffect(() => {
    if (
      reloadReady &&
      (conflictRecord.current.code === "ACCESS_REQUEST_ID_CONFLICT" ||
        record?.revision !== conflictRecord.current.revision ||
        !record)
    )
      onClose();
  }, [reloadReady, record, onClose]);
  const selected = picker.data?.items.find((row) => row.id === targetId);
  const fields = relevantLimitFields(scope, selected?.buckets);
  // Existing packages preserve only caps actually present; picker resolves actual published children for new campaigns.
  const visibleFields =
    scope === "MOCK_PACKAGE" && !selected && record
      ? (["writingMockLimit", "speakingMockLimit"] as const).filter(
          (field) => record[field] > 0,
        )
      : fields;
  const revoke = async () => {
    if (!requireOwner() || !record || lock.current || conflict) return;
    lock.current = true;
    setBusy(true);
    try {
      const payload = { expectedRevision: record.revision, reason };
      await accessWrite(
        `${accessEndpoints.publicPolicies}/${record.id}/revoke`,
        {
          ...payload,
          requestId: intent.current.forPayload({
            action: "revoke",
            id: record.id,
            ...payload,
          }),
        },
        "post",
        ownerAdminId,
      );
      if (!requireOwner()) return;
      await refresh();
      if (!requireOwner()) return;
      onClose();
    } catch (e) {
      if (!requireOwner()) return;
      const detail = accessError(e);
      setError(detail);
      setConflict(isAccessConflict(e));
      if (isAccessConflict(e))
        conflictRecord.current = {
          revision: record?.revision,
          code: accessErrorCode(e),
        };
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const save = async () => {
    if (!requireOwner() || lock.current || conflict || !windowValid) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (scope !== "PLATFORM" && !targetId)
        throw new Error("Yayındaki bir içerik seçin.");
      if (
        new Date(window.endsAt) <= new Date(window.startsAt) ||
        new Date(window.endsAt) <= new Date()
      )
        throw new Error("Bitiş gelecekte ve başlangıçtan sonra olmalıdır.");
      if (scope === "MOCK_PACKAGE" && !selected && !record)
        throw new Error("Paketi yayındaki içerik seçicisinden seçin.");
      const payload: Partial<AccessPayload> = {
        ...window,
        scope,
        ...(scope !== "PLATFORM" ? { targetId } : {}),
        reason,
        ...(userId ? { userId } : {}),
        ...(record ? { expectedRevision: record.revision } : {}),
      };
      visibleFields.forEach((field) => {
        payload[field] =
          limits[field] ??
          (scope === "PLATFORM" ? (field === "practiceAiLimit" ? 120 : 10) : 1);
      });
      const base =
        kind === "grant"
          ? accessEndpoints.grants
          : kind === "public"
            ? accessEndpoints.publicPolicies
            : accessEndpoints.shares;
      if (kind === "share" && record) {
        delete payload.scope;
        delete payload.targetId;
      }
      await accessWrite(
        record && kind !== "public" ? `${base}/${record.id}` : base,
        { ...payload, requestId: intent.current.forPayload(payload) },
        record && kind !== "public" ? "patch" : "post",
        ownerAdminId,
      );
      if (!requireOwner()) return;
      await refresh();
      if (!requireOwner()) return;
      onSaved?.();
      onClose();
    } catch (e) {
      if (!requireOwner()) return;
      const detail = accessError(e);
      setError(detail);
      setConflict(isAccessConflict(e));
      if (isAccessConflict(e))
        conflictRecord.current = {
          revision: record?.revision,
          code: accessErrorCode(e),
        };
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      open={currentSession}
      title={
        kind === "grant"
          ? "Kişisel erişim"
          : kind === "public"
            ? "Süreli herkese açık erişim"
            : "Süreli ücretsiz bağlantı"
      }
      onCancel={busy ? undefined : onClose}
      onOk={() => void save()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={busy}
      okButtonProps={{ disabled: !currentSession || conflict || !windowValid }}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {error && (
          <Alert
            type="error"
            message={error}
            action={
              conflict ? (
                <Button
                  onClick={async () => {
                    if (!requireOwner()) return;
                    try {
                      await refresh();
                      setReloadReady(true);
                    } catch {
                      /* Keep stale edits blocked when refreshing fails. */
                    }
                  }}
                >
                  Yeniden yükle
                </Button>
              ) : undefined
            }
          />
        )}
        <label>
          Kapsam
          <Select
            style={{ width: "100%" }}
            aria-label="Kapsam"
            value={scope}
            disabled={!!target || (kind === "share" && !!record)}
            options={accessScopes
              .filter((s) => kind === "grant" || s !== "PLATFORM")
              .map((value) => ({ value, label: scopeLabels[value] }))}
            onChange={(s) => {
              setScope(s);
              setTargetId(undefined);
              setLimits({});
              setPage(1);
            }}
          />
        </label>
        {scope !== "PLATFORM" && (
          <>
            <label>
              Yayındaki içerik
              <Select
                aria-label="Yayındaki içerik"
                style={{ width: "100%" }}
                value={targetId}
                disabled={!!target || (kind === "share" && !!record)}
                showSearch
                filterOption={false}
                onSearch={(q) => {
                  setSearch(q);
                  setPage(1);
                }}
                loading={picker.isFetching}
                options={picker.data?.items.map((row) => ({
                  value: row.id,
                  label: row.title,
                }))}
                onChange={setTargetId}
              />
            </label>
            {!target && (
              <Space>
                <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Önceki
                </Button>
                <Button
                  disabled={page * 25 >= (picker.data?.total ?? 0)}
                  onClick={() => setPage(page + 1)}
                >
                  Sonraki
                </Button>
              </Space>
            )}
            {picker.isError && (
              <Alert
                type="error"
                message="İçerikler yüklenemedi"
                action={
                  <Button onClick={() => void picker.refetch()}>
                    Yeniden dene
                  </Button>
                }
              />
            )}
          </>
        )}
        <AccessTimeWindow
          value={window}
          onChange={setWindow}
          onValidityChange={setWindowValid}
        />
        {visibleFields.map((field) => (
          <label key={field}>
            {labels[field]}
            <InputNumber
              aria-label={labels[field]}
              min={0}
              max={2147483647}
              precision={0}
              value={
                limits[field] ??
                (scope === "PLATFORM"
                  ? field === "practiceAiLimit"
                    ? 120
                    : 10
                  : 1)
              }
              onChange={(n) => setLimits({ ...limits, [field]: n ?? 0 })}
            />
          </label>
        ))}
        <Typography.Text type="secondary">
          Limitler öğrenci başınadır. Paket erişimi yalnız uygun yayındaki
          becerileri kapsar.
        </Typography.Text>
        <>
          {kind === "public" && record && !record.revokedAt && (
            <Button danger loading={busy} onClick={() => void revoke()}>
              Herkese açık erişimi iptal et
            </Button>
          )}
        </>
        <label>
          İç not
          <Input.TextArea
            aria-label="İç not"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      </Space>
    </Modal>
  );
}
