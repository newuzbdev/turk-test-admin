import TestEditor from "@/shared/components/test-editor";
import { useCreateReadingTestWithAddition } from "@/config/queries/reading/create.queries";
import { useParams } from "react-router-dom";

// import { useGetOneReadingTest } from "@/config/queries/reading/get-one.queries";

export default function ReadingEditor() {
  const { ieltsId } = useParams<{ ieltsId: string }>();

  return (
    <TestEditor
      ieltsId={ieltsId}
      testType="READING"
      backUrl="/reading"
      // useGetOneTest={useGetOneReadingTest}
      useCreateTestWithAddition={useCreateReadingTestWithAddition}
    />
  );
}
