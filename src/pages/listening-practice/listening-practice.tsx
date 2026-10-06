import { listeningPracticeEndpoints } from "@/config/endpoint";
import PracticeAdminList from "@/pages/practice-admin/practice-admin-list";

const sections = Array.from({ length: 6 }, (_, index) => ({
  value: `PART_${index + 1}`,
  label: `Bölüm ${index + 1}`,
}));

export default function ListeningPractice() {
  return (
    <PracticeAdminList
      title="Dinleme pratikleri"
      singularLabel="Dinleme"
      endpoints={listeningPracticeEndpoints}
      editorPath={(id) => `/listening-practice/${id}/edit`}
      sectionOptions={sections}
      defaultMinutes={15}
    />
  );
}
