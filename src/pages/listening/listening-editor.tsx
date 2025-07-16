import TestEditor from "@/shared/components/test-editor";
import { useGetOneListeningTest } from "@/config/queries/listening/get-one.queries";
import { useCreateListeningTestWithAddition } from "@/config/queries/listening/create.queries";

export default function ListeningEditor() {
  return (
    <TestEditor
      testType="LISTENING"
      backUrl="/listening"
      useGetOneTest={useGetOneListeningTest}
      useCreateTestWithAddition={useCreateListeningTestWithAddition}
    />
  );
}
