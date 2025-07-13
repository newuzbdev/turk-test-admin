import BaseQuestionForm from "../../../shared/ui/test-creation/base-question-form";
import type { TestQuestionDto } from "../../../config/querys/test-query";

interface ListeningQuestionFormProps {
  question: TestQuestionDto;
  onChange: (question: TestQuestionDto) => void;
  onRemove: () => void;
  testType: "LISTENING" | "READING";
}

export default function ListeningQuestionForm(
  props: ListeningQuestionFormProps
) {
  return <BaseQuestionForm {...props} testType="LISTENING" />;
}
