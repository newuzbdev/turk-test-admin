import { useParams } from "react-router-dom";
import ReadingTestEditor from "./components/reading-test-editor";

export default function ReadingEditor() {
  const { ieltsId } = useParams<{ ieltsId: string }>();

  if (!ieltsId) {
    return <div>IELTS ID not found</div>;
  }

  return (
    <ReadingTestEditor
      ieltsId={ieltsId}
      backUrl="/reading"
    />
  );
}
