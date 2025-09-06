import TestEditor from "@/shared/components/test-editor";
// import { useGetOneReadingTest } from "@/config/queries/reading/get-one.queries";
// import { useCreateReadingTestWithAddition } from "@/config/queries/reading/create.queries";

export default function ReadingEditor() {
  return (
    <TestEditor
      testType="READING"
      // backUrl="/reading"
      // useGetOneTest={useGetOneReadingTest}
      // useCreateTestWithAddition={useCreateReadingTestWithAddition}
    />
  );
}
