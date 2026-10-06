import { useLocation, useParams } from "react-router-dom";
import ReadingTestEditor from "./components/reading-test-editor";
import { useUpdateReadingTestWithAddition } from "@/config/queries/reading/update.queries";
import { useGetReadingTestWithAddition } from "@/config/queries/reading/get-one.queries";

interface ReadingEditorProps {
  layout?: "legacy" | "v2";
}

export default function ReadingEditor({ layout = "legacy" }: ReadingEditorProps) {
  const { ieltsId: routeId } = useParams<{ ieltsId: string }>();
  const location = useLocation();
  const isNew = Boolean((location.state as { isNew?: boolean } | null)?.isNew);
  const ieltsId = isNew ? routeId : "";
  const testId = isNew ? undefined : routeId;

  if (!routeId) {
    return <div>Test ID not found</div>;
  }

  return (
    <ReadingTestEditor
      ieltsId={ieltsId || ""}
      testId={testId}
      backUrl="/reading"
      useUpdateTestWithAddition={useUpdateReadingTestWithAddition}
      useGetTestWithAddition={useGetReadingTestWithAddition}
      layout={layout}
    />
  );
}
