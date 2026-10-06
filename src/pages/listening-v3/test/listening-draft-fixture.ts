import { createOfficialListeningDraft, isSingleUseListeningPart } from "../listening-editor-model";

export const completeListeningDraft = (testId = "test-1") => {
  const draft = createOfficialListeningDraft({ ieltsId: "group-1", title: "Dinleme testi" });
  Object.assign(draft, { testId, status: "DRAFT", publishedAt: null, contentRevision: 1, audioUrl: "uploads/listening.mp3", audioDurationSeconds: 300 });
  draft.parts.forEach((part) => {
    part.apiId = `${testId}-part-${part.number}`;
    part.sectionApiId = `${testId}-section-${part.number}`;
    part.transcript = "Birinci cümle. İkinci cümle.";
    part.transcriptFormatted = part.transcript;
    if (part.number === 4) part.imageUrl = "uploads/map.png";
    part.optionBank.forEach((option) => { option.text = `${option.variant} seçeneği`; });
    part.questions.forEach((question, index) => {
      question.apiId = `${testId}-question-${question.number}`;
      question.prompt = `Soru ${question.number}`;
      question.options.forEach((option) => { option.text = `${option.variant} seçeneği`; });
      const options = part.optionBank.length ? part.optionBank : question.options;
      question.correctVariant = options[isSingleUseListeningPart(part.number) ? index : 0].variant;
      question.answerIdsByVariant = Object.fromEntries(options.map((option) => [option.variant, `${testId}-answer-${question.number}-${option.variant}`]));
      question.evidence = { evidenceText: "Birinci", textStart: 0, textEnd: 7, explanation: "Cevabı destekleyen söz.", audioStartMs: 1000, audioEndMs: 3000 };
    });
  });
  return draft;
};

export const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
