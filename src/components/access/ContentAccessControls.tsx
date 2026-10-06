import { Alert, Button, Space, message } from "antd";
import { useState } from "react";
import {
  useAccessConfig,
  useTargetAccess,
  type AccessTarget,
} from "@/config/queries/access";
import PublicAccessDialog from "./PublicAccessDialog";
import AccessShareDialog from "./AccessShareDialog";
import {
  isCompatiblePublished,
  normalContentLink,
  type ContentAccessRow,
} from "./content-access-utils";
export default function ContentAccessControls({
  target,
  row,
  onChanged,
}: {
  target: AccessTarget;
  row: ContentAccessRow;
  onChanged?: () => void;
}) {
  const config = useAccessConfig();
  const [dialog, setDialog] = useState<"public" | "share">();
  const compatible = isCompatiblePublished(target, row);
  const policies = useTargetAccess("public-access", target);
  const packageId = row.ieltsId ?? row.ielts?.id;
  const normal =
    target.scope.startsWith("PRACTICE_") ||
    target.scope === "MOCK_PACKAGE" ||
    !!packageId;
  const close = () => {
    setDialog(undefined);
    onChanged?.();
  };
  return (
    <span onClick={(e) => e.stopPropagation()}>
      {!normal && config.data?.enabled && <span role="status">Yayındaki bir deneme paketine bağlı olmayan içerik için yeni erişim oluşturulamaz.</span>}
      <Space wrap>
        {normal && (
          <Button
            size="small"
            disabled={!compatible}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  normalContentLink(target, packageId),
                );
                message.success("Bağlantı kopyalandı.");
              } catch {
                message.error("Bağlantı kopyalanamadı.");
              }
            }}
          >
            Linki kopyala
          </Button>
        )}
        {config.data?.enabled && (
          <>
            <Button
              size="small"
              disabled={!compatible && !policies.data?.length}
              onClick={() => setDialog("public")}
            >
              Süreli herkese açık erişim
            </Button>
            <Button
              size="small"
              disabled={!target.targetId || !normal}
              onClick={() => setDialog("share")}
            >
              Süreli ücretsiz bağlantı
            </Button>
          </>
        )}
        {dialog === "public" &&
          (policies.isLoading ? (
            <span>Yükleniyor…</span>
          ) : policies.isError ? (
            <Alert
              type="error"
              message="Erişim yüklenemedi"
              action={
                <Button onClick={() => void policies.refetch()}>
                  Yeniden dene
                </Button>
              }
            />
          ) : (
            <PublicAccessDialog
              target={target}
              record={policies.data?.[0]}
              onClose={close}
            />
          ))}
        {dialog === "share" && (
          <AccessShareDialog
            target={target}
            onClose={close}
            canCreate={compatible}
          />
        )}
      </Space>
    </span>
  );
}
export function ManagedLegacyAccess({
  target,
  children,
}: {
  target: AccessTarget;
  children: React.ReactNode;
}) {
  const config = useAccessConfig();
  const policy = useTargetAccess("public-access", target);
  if (
    target.targetId &&
    (config.isLoading ||
      config.isError ||
      (config.data?.enabled && (!policy.isSuccess || !!policy.data?.length)))
  )
    return (
      <span>
        {policy.isError
          ? "Erişim durumu yüklenemedi."
          : policy.isSuccess
            ? "Süreli erişim politikası ile yönetiliyor."
            : "Erişim yükleniyor…"}
      </span>
    );
  return <>{children}</>;
}
