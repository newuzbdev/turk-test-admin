import EnhancedSectionForm from "../../../shared/ui/test-creation/enhanced-section-form";
import type { TestSectionDto } from "../../../config/querys/test-query";

interface ListeningSectionFormProps {
  section: TestSectionDto;
  onChange: (section: TestSectionDto) => void;
  onRemove: () => void;
}

export default function ListeningSectionForm(props: ListeningSectionFormProps) {
  return <EnhancedSectionForm {...props} testType="LISTENING" />;
}
