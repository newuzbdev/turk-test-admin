import { Alert, Button, Modal, Space } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  accessError,
  isAccessConflict,
  accessErrorCode,
  accessWrite,
  useRefreshAccess,
  type AccessRecord,
} from "@/config/queries/access";
import { accessEndpoints } from "@/config/endpoint";
import AccessGrantDialog from "./AccessGrantDialog";
import { RequestIntent } from "./access-form-state";
export default function AccessRecordActions({
  kind,
  record,
  copy,
}: {
  kind: "grant" | "public" | "share";
  record: AccessRecord;
  copy?: () => Promise<void>;
}) {
  const [edit, setEdit] = useState(false);
  const [action, setAction] = useState<"revoke" | "rotate">();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [reloadRequested, setReloadRequested] = useState(false);
  const conflictRevision = useRef<number | undefined>(undefined);
  const conflictCode = useRef<string | undefined>(undefined);
  const lock = useRef(false);
  const intent = useRef(new RequestIntent());
  const refresh = useRefreshAccess();
  useEffect(() => {
    if (reloadRequested && (record.revision !== conflictRevision.current || conflictCode.current === 'ACCESS_REQUEST_ID_CONFLICT')) {
      setError(""); setConflict(false); setAction(undefined); setReloadRequested(false);
      intent.current = new RequestIntent();
    }
  }, [reloadRequested, record.revision]);
  const perform = async (fn: () => Promise<unknown>) => {
    if (lock.current || conflict) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
      setAction(undefined);
    } catch (e) {
      const detail = accessError(e);
      setError(detail);
      setConflict(isAccessConflict(e));
      if (isAccessConflict(e)) { conflictRevision.current = record.revision; conflictCode.current = accessErrorCode(e); }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const mutate = async () => {
    const base =
      kind === "grant"
        ? accessEndpoints.grants
        : kind === "public"
          ? accessEndpoints.publicPolicies
          : accessEndpoints.shares;
    const payload = {
      expectedRevision: record.revision,
      ...(action === "rotate" ? { confirmRotation: true } : {}),
    };
    await perform(() =>
      accessWrite(`${base}/${record.id}/${action}`, {
        ...payload,
        requestId: intent.current.forPayload({
          action,
          id: record.id,
          ...payload,
        }),
      }),
    );
  };
  const errorNotice = error && (
    <Alert
      type="error"
      message={error}
      action={
        conflict ? (
          <Button
            onClick={async () => {
              try { await refresh(); setReloadRequested(true); } catch { /* Keep the conflict blocked until a fresh record arrives. */ }
            }}
          >
            Yeniden yükle
          </Button>
        ) : undefined
      }
    />
  );
  return (
    <Space wrap>
      <Button size="small" onClick={() => setEdit(true)}>
        Süre / limit düzenle
      </Button>
      {copy && (
        <Button size="small" loading={busy} onClick={() => void perform(copy)}>
          Bağlantıyı kopyala
        </Button>
      )}
      {kind === "share" && (
        <Button size="small" onClick={() => setAction("rotate")}>
          URL yenile
        </Button>
      )}
      <Button
        size="small"
        danger
        disabled={!!record.revokedAt}
        onClick={() => setAction("revoke")}
      >
        İptal et
      </Button>
      {!action && errorNotice}
      {edit && (
        <AccessGrantDialog
          kind={kind}
          record={record}
          target={
            kind === "grant"
              ? undefined
              : { scope: record.scope, targetId: record.targetId }
          }
          onClose={() => setEdit(false)}
        />
      )}
      <Modal
        open={!!action}
        title={
          action === "rotate" ? "Bağlantı URL'sini yenile" : "Erişimi iptal et"
        }
        okText={action === "rotate" ? "URL yenile" : "İptal et"}
        cancelText="Vazgeç"
        confirmLoading={busy}
        okButtonProps={{ danger: true, disabled: conflict }}
        onOk={() => void mutate()}
        onCancel={busy ? undefined : () => setAction(undefined)}
      >
        {errorNotice}
        {action === "rotate"
          ? "Eski URL yeni katılımcı kabul etmez. Mevcut katılımcıların kampanya erişimi ve süresi korunur."
          : kind === "share"
            ? "Tüm katılımcıların bu kampanya erişimi kapanır."
            : "Bu erişim kapanır."}
      </Modal>
    </Space>
  );
}
