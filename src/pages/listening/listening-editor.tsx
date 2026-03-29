import TestEditor from "@/shared/components/test-editor";
import { useCreateListeningTestWithAddition } from "@/config/queries/listening/create.queries";
import { useUpdateListeningTestWithAddition } from "@/config/queries/listening/update.queries";
import { useGetListeningTestWithAddition } from "@/config/queries/listening/get-one.queries";
import { useParams } from "react-router-dom";

export default function ListeningEditor() {
  const { testId } = useParams<{ testId: string }>();

  return (
    <TestEditor
      ieltsId={testId}
      testId={testId}
      testType="LISTENING"
      backUrl="/listening"
      useCreateTestWithAddition={useCreateListeningTestWithAddition}
      useUpdateTestWithAddition={useUpdateListeningTestWithAddition}
      useGetTestWithAddition={useGetListeningTestWithAddition}
    />
  );
}
