import { speakingPracticeEndpoints } from "@/config/endpoint";
import PracticeAdminList from "@/pages/practice-admin/practice-admin-list";

const sections = [
  { value: "TASK_1_1", label: "Bölüm 1.1" },
  { value: "TASK_1_2", label: "Bölüm 1.2" },
  { value: "TASK_2", label: "Bölüm 2" },
  { value: "TASK_3", label: "Bölüm 3" },
];

export default function SpeakingPractice() {
  return (
    <PracticeAdminList
      title="Konuşma pratikleri"
      singularLabel="Konuşma"
      endpoints={speakingPracticeEndpoints}
      editorPath={(id) => `/speaking-practice/${id}/edit`}
      sectionOptions={sections}
      defaultMinutes={20}
    />
  );
}
