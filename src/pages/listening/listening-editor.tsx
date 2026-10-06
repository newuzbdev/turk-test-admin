import TestEditor from "@/shared/components/test-editor";
import { useCreateListeningTestWithAddition } from "@/config/queries/listening/create.queries";
import { useUpdateListeningTestWithAddition } from "@/config/queries/listening/update.queries";
import { useGetListeningTestWithAddition } from "@/config/queries/listening/get-one.queries";
import { useLocation, useParams } from "react-router-dom";

export default function ListeningEditor() {
  const { ieltsId: routeId } = useParams<{ ieltsId: string }>();
  const location = useLocation();
  const isNew = Boolean((location.state as any)?.isNew);
  const ieltsId = isNew ? routeId : undefined;
  const testId = isNew ? undefined : routeId;

  return (
    <TestEditor
      ieltsId={ieltsId}
      testId={testId}
      testType="LISTENING"
      backUrl="/listening"
      useCreateTestWithAddition={useCreateListeningTestWithAddition}
      useUpdateTestWithAddition={useUpdateListeningTestWithAddition}
      useGetTestWithAddition={useGetListeningTestWithAddition}
    />
  );
}
