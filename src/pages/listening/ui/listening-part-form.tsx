import BasePartForm from "../../../shared/ui/test-creation/base-part-form";
import ListeningSectionForm from "./listening-section-form";
import type { TestPartDto } from "../../../config/querys/test-query";

interface ListeningPartFormProps {
  part: TestPartDto;
  onChange: (part: TestPartDto) => void;
  onRemove: () => void;
}

export default function ListeningPartForm(props: ListeningPartFormProps) {
  return (
    <BasePartForm
      {...props}
      testType="LISTENING"
      sectionComponent={ListeningSectionForm}
    />
  );
}
