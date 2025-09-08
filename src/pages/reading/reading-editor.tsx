import TestEditor from "@/shared/components/test-editor";
import { useCreateReadingTestWithAddition } from "@/config/queries/reading/create.queries";

// import { useGetOneReadingTest } from "@/config/queries/reading/get-one.queries";

export default function ReadingEditor() {
  return (
    <TestEditor
      testType="READING"
      backUrl="/reading"
      // useGetOneTest={useGetOneReadingTest}
      useCreateTestWithAddition={useCreateReadingTestWithAddition}
    />
  );
}
