import AccessGrantDialog from "./AccessGrantDialog";
import type { AccessRecord, AccessTarget } from "@/config/queries/access";
export default function PublicAccessDialog({
  target,
  record,
  onClose,
}: {
  target: AccessTarget;
  record?: AccessRecord;
  onClose: () => void;
}) {
  return (
    <AccessGrantDialog
      target={target}
      record={record}
      kind="public"
      onClose={onClose}
    />
  );
}
