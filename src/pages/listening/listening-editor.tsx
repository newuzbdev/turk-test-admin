import TestEditor from "@/shared/components/test-editor";
import { useCreateListeningTestWithAddition } from "@/config/queries/listening/create.queries";
import { useParams } from "react-router-dom";

// import { useGetOneListeningTest } from "@/config/queries/listening/get-one.queries";


export default function ListeningEditor() {
  const { ieltsId } = useParams<{ ieltsId: string }>();

  return (
    <TestEditor
      ieltsId={ieltsId}
      testType="LISTENING"
      backUrl="/listening"
      // useGetOneTest={useGetOneListeningTest}
      useCreateTestWithAddition={useCreateListeningTestWithAddition}
    />
  );
}
