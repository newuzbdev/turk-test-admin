import type {
  LearnExerciseQuestion,
  LearnQuestionFormValues,
  LearnQuestionPayload,
  LearnQuestionType,
} from "./course-types";

export const LEARN_EXERCISE_TYPE_OPTIONS = [
  { value: "PRACTICE", label: "Pratik" },
  { value: "QUIZ", label: "Kısa sınav" },
  { value: "FINAL", label: "Final alıştırması" },
] as const;

export const LEARN_QUESTION_TYPE_OPTIONS: Array<{
  value: LearnQuestionType;
  label: string;
}> = [
  { value: "MULTIPLE_CHOICE", label: "Tek seçim" },
  { value: "MULTI_SELECT", label: "Çoklu seçim" },
  { value: "TRUE_FALSE", label: "Doğru / yanlış" },
  { value: "TEXT_INPUT", label: "Metin cevabı" },
  { value: "FILL_BLANK", label: "Boşluk doldurma" },
];

export const getLearnQuestionTypeLabel = (type: LearnQuestionType) =>
  LEARN_QUESTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
  type;

const lines = (value?: string) =>
  (value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const clean = (value?: string) => value?.trim() || undefined;

export const buildLearnQuestionPayload = (
  values: LearnQuestionFormValues
): LearnQuestionPayload => {
  const base = {
    type: values.type,
    prompt: values.prompt.trim(),
    explanation: clean(values.explanation),
    points: values.points,
  };

  if (values.type === "MULTIPLE_CHOICE") {
    return {
      ...base,
      options: lines(values.optionsText),
      answerKey: { optionIndex: (values.correctOption ?? 1) - 1 },
    };
  }

  if (values.type === "MULTI_SELECT") {
    const optionIndexes = (values.correctOptionsText ?? "")
      .split(",")
      .map((value) => Number(value.trim()) - 1)
      .filter((value) => Number.isInteger(value) && value >= 0);
    return {
      ...base,
      options: lines(values.optionsText),
      answerKey: { optionIndexes: [...new Set(optionIndexes)] },
    };
  }

  if (values.type === "TRUE_FALSE") {
    return {
      ...base,
      options: null,
      answerKey: { value: values.trueFalseValue === "true" },
    };
  }

  return {
    ...base,
    options: null,
    answerKey: { acceptedAnswers: lines(values.acceptedAnswersText) },
  };
};

export const questionToFormValues = (
  question: LearnExerciseQuestion
): LearnQuestionFormValues => {
  const base: LearnQuestionFormValues = {
    type: question.type,
    prompt: question.prompt,
    explanation: question.explanation ?? undefined,
    optionsText: question.options?.join("\n"),
    points: question.points,
  };

  if ("optionIndex" in question.answerKey) {
    base.correctOption = question.answerKey.optionIndex + 1;
  } else if ("optionIndexes" in question.answerKey) {
    base.correctOptionsText = question.answerKey.optionIndexes
      .map((index) => index + 1)
      .join(", ");
  } else if ("value" in question.answerKey) {
    base.trueFalseValue = question.answerKey.value ? "true" : "false";
  } else {
    base.acceptedAnswersText = question.answerKey.acceptedAnswers.join("\n");
  }

  return base;
};
