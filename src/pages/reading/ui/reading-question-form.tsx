import React from "react";
import BaseQuestionForm from "../../../shared/ui/test-creation/base-question-form";
import type { TestQuestionDto } from "../../../config/querys/test-query";

interface ReadingQuestionFormProps {
  question: TestQuestionDto;
  onChange: (question: TestQuestionDto) => void;
  onRemove: () => void;
  testType: "LISTENING" | "READING";
}

export default function ReadingQuestionForm(props: ReadingQuestionFormProps) {
  return <BaseQuestionForm {...props} testType="READING" />;
}
