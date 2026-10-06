import { writingPracticeEndpoints } from "@/config/endpoint";
import PracticeAdminList from "@/pages/practice-admin/practice-admin-list";

const sections = [
  { value: "TASK_1_1", label: "Bölüm 1.1" },
  { value: "TASK_1_2", label: "Bölüm 1.2" },
  { value: "TASK_2", label: "Bölüm 2" },
];

export default function WritingPractice() {
  return (
    <PracticeAdminList
      title="Yazma pratikleri"
      singularLabel="Yazma"
      endpoints={writingPracticeEndpoints}
      editorPath={(id) => `/writing-practice/${id}/edit`}
      sectionOptions={sections}
      defaultMinutes={20}
    />
  );
}
