import { createOfficialReadingDraft, getQuestionSource } from "../reading-editor-model";

export const completeReadingDraft = (testId = "test-1") => {
  const draft = createOfficialReadingDraft({ ieltsId: "group-1", title: "Okuma denemesi" });
  draft.testId = testId;
  draft.status = "DRAFT";
  draft.contentRevision = 1;
  draft.publishedAt = null;
  for (const part of draft.parts) {
    part.sourceTitle = "Okuma metni";
    part.sourceText = part.number === 1
      ? "Ortak kaynak. ___ (S1) ___ (S2) ___ (S3) ___ (S4) ___ (S5) ___ (S6)"
      : "Ortak kaynak metni.";
    part.optionBank.forEach((option) => { option.text = `${option.variant} seçeneği`; });
    part.questions.forEach((question, index) => {
      question.sourceTitle = `Kart ${question.number}`;
      question.sourceText = `Soru ${question.number} kaynak metni.`;
      question.prompt = `Soru ${question.number}`;
      question.options.forEach((option) => { option.text = `${option.variant} seçeneği`; });
      question.correctVariant = part.optionBank[index]?.variant || "A";
      const source = getQuestionSource(part, question);
      question.evidence = { evidenceText: source, textStart: 0, textEnd: source.length, explanation: "Metin bu seçeneği destekler." };
    });
  }
  return draft;
};

export const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
