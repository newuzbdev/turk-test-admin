import { useParams } from "react-router-dom";
import ReadingTestEditor from "./components/reading-test-editor";
import { useUpdateReadingTestWithAddition } from "@/config/queries/reading/update.queries";
import { useGetReadingTestWithAddition } from "@/config/queries/reading/get-one.queries";

export default function ReadingEditor() {
  const { testId } = useParams<{ testId: string }>();

  if (!testId) {
    return <div>Test ID not found</div>;
  }

  return (
    <ReadingTestEditor
      ieltsId={testId}
      testId={testId}
      backUrl="/reading"
      useUpdateTestWithAddition={useUpdateReadingTestWithAddition}
      useGetTestWithAddition={useGetReadingTestWithAddition}
    />
  );
}
