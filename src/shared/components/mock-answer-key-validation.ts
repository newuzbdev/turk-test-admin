type SharedAnswer = {
  text?: string | null;
  isCorrect?: boolean | null;
};

type SharedQuestion = {
  number?: number | null;
  text?: string | null;
  answers?: SharedAnswer[] | null;
  correctVariantIndex?: number | null;
};

type SharedSection = {
  title?: string | null;
  type?: string | null;
  sharedVariants?: SharedAnswer[] | null;
  questions?: SharedQuestion[] | null;
};

type SharedPart = {
  title?: string | null;
  sections?: SharedSection[] | null;
};

type ReadingOption = {
  letter?: string | null;
  text?: string | null;
};

type ReadingQuestion = {
  blankNumber?: number | null;
  correctAnswer?: string | null;
  options?: ReadingOption[] | null;
};

type ReadingSection = {
  title?: string | null;
  sharedVariants?: ReadingOption[] | null;
  questions?: ReadingQuestion[] | null;
};

type ReadingPart = {
  title?: string | null;
  sections?: ReadingSection[] | null;
};

type StoredAnswer = {
  correct?: boolean | null;
  variantText?: string | null;
};

const hasText = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

export const getStoredCorrectVariant = (
  answers: StoredAnswer[] | null | undefined,
): string => {
  const selected = (answers ?? []).find((answer) => answer.correct === true);
  return hasText(selected?.variantText) ? String(selected?.variantText).trim() : "";
};

export const findSharedEditorMissingAnswerKeys = (
  parts: SharedPart[] | null | undefined,
): number[] => {
  let fallbackNumber = 0;

  return (parts ?? []).flatMap((part) =>
    (part.sections ?? []).flatMap((section) =>
      (section.questions ?? []).flatMap((question) => {
        fallbackNumber += 1;
        const questionNumber = Number(question.number) || fallbackNumber;
        const isMatching = section.type === "MATCHING";
        const hasSelectedIndex =
          typeof question.correctVariantIndex === "number";
        const selectedIndex = Number(question.correctVariantIndex);
        const matchingReady =
          isMatching &&
          hasSelectedIndex &&
          Number.isInteger(selectedIndex) &&
          selectedIndex >= 0 &&
          hasText(section.sharedVariants?.[selectedIndex]?.text);
        const answerReady = (question.answers ?? []).some(
          (answer) => answer.isCorrect === true && hasText(answer.text),
        );

        return matchingReady || answerReady ? [] : [questionNumber];
      }),
    ),
  );
};

export const findReadingEditorMissingAnswerKeys = (
  parts: ReadingPart[] | null | undefined,
): number[] => {
  let fallbackNumber = 0;

  return (parts ?? []).flatMap((part) =>
    (part.sections ?? []).flatMap((section) =>
      (section.questions ?? []).flatMap((question) => {
        fallbackNumber += 1;
        const questionNumber = Number(question.blankNumber) || fallbackNumber;
        const selectedLetter = String(question.correctAnswer || "").trim();
        const options =
          section.sharedVariants && section.sharedVariants.length > 0
            ? section.sharedVariants
            : question.options ?? [];
        const selectedOption = options.find(
          (option) => String(option.letter || "").trim() === selectedLetter,
        );

        return hasText(selectedLetter) && hasText(selectedOption?.text)
          ? []
          : [questionNumber];
      }),
    ),
  );
};
