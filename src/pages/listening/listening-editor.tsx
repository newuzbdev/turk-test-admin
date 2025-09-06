import TestEditor from "@/shared/components/test-editor";
// import { useGetOneListeningTest } from "@/config/queries/listening/get-one.queries";
// import { useCreateListeningTestWithAddition } from "@/config/queries/listening/create.queries";
import { useParams } from "react-router-dom";

export default function ListeningEditor() {
  const { ieltsId } = useParams<{ ieltsId: string }>();
  console.log("IELTS ID:", ieltsId);

  return (
    <TestEditor
      ieltsId={ieltsId}
      testType="LISTENING"
    // backUrl="/listening"
    // useGetOneTest={useGetOneListeningTest}
    // useCreateTestWithAddition={useCreateListeningTestWithAddition}
    />
  );
}
