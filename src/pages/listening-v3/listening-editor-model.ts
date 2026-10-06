export const OFFICIAL_LISTENING_MARKER = "TM_LISTENING_OFFICIAL_V1";

export type ListeningQuestionType =
  | "MATCHING"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE";

export type ListeningOptionDraft = {
  apiId?: string;
  variant: string;
  text: string;
};

export type ListeningEvidenceSpanDraft = {
  evidenceText: string;
  textStart: number;
  textEnd: number;
};

export type ListeningEvidenceDraft = ListeningEvidenceSpanDraft & {
  explanation: string;
  audioStartMs: number;
  audioEndMs: number;
  evidenceSpans?: ListeningEvidenceSpanDraft[];
};

export type ListeningQuestionDraft = {
  key: string;
  apiId?: string;
  number: number;
  type: ListeningQuestionType;
  prompt: string;
  options: ListeningOptionDraft[];
  correctVariant: string;
  evidence?: ListeningEvidenceDraft;
  answerIdsByVariant?: Record<string, string>;
};

export type ListeningPartDraft = {
  key: string;
  apiId?: string;
  sectionApiId?: string;
  number: number;
  title: string;
  description: string;
  transcript: string;
  transcriptFormatted: string;
  imageUrl: string;
  optionBank: ListeningOptionDraft[];
  questions: ListeningQuestionDraft[];
};

export type OfficialListeningDraft = {
  testId?: string;
  status?: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  contentRevision?: number;
  ieltsId: string;
  title: string;
  description: string;
  audioUrl: string;
  audioDurationSeconds: number | null;
  parts: ListeningPartDraft[];
};

export type ListeningValidationField =
  | "title"
  | "audio"
  | "instruction"
  | "transcript"
  | "image"
  | "prompt"
  | "options"
  | "correctAnswer"
  | "evidence"
  | "explanation"
  | "audioRange";

export type ListeningValidationIssue = {
  code:
    | "TITLE_REQUIRED"
    | "AUDIO_REQUIRED"
    | "AUDIO_DURATION_REQUIRED"
    | "INSTRUCTION_REQUIRED"
    | "TRANSCRIPT_REQUIRED"
    | "IMAGE_REQUIRED"
    | "QUESTION_REQUIRED"
    | "OPTIONS_REQUIRED"
    | "CORRECT_ANSWER_REQUIRED"
    | "DUPLICATE_CORRECT_ANSWER"
    | "EVIDENCE_REQUIRED"
    | "EXPLANATION_REQUIRED"
    | "EVIDENCE_SOURCE_MISMATCH"
    | "AUDIO_RANGE_REQUIRED"
    | "AUDIO_RANGE_INVALID";
  field: ListeningValidationField;
  partNumber: number;
  questionNumber: number | null;
  message: string;
};

export type ListeningValidationResult = {
  ready: boolean;
  issues: ListeningValidationIssue[];
  completedQuestions: number;
  totalQuestions: 35;
  partProgress: Record<number, { completed: number; total: number }>;
};

type CreateDraftInput = {
  ieltsId: string;
  title?: string;
};

type ApiAnswer = {
  id?: string;
  variantText?: string | null;
  answer?: string | null;
  displayText?: string | null;
  correct?: boolean | null;
};

type ApiEvidence =
  | (Partial<ListeningEvidenceDraft> & { evidenceSpans?: unknown })
  | null;

type ApiQuestion = {
  id?: string;
  number?: number;
  type?: ListeningQuestionType;
  text?: string | null;
  content?: string | null;
  answers?: ApiAnswer[];
  evidence?: ApiEvidence;
};

type ApiSection = {
  id?: string;
  title?: string | null;
  content?: string | null;
  transcript?: string | null;
  imageUrl?: string | null;
  questions?: ApiQuestion[];
};

type ApiPart = {
  id?: string;
  number?: number;
  title?: string | null;
  description?: string | null;
  audioUrl?: string | null;
  sections?: ApiSection[];
};

type ApiListeningTest = {
  id?: string;
  status?: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  contentRevision?: number;
  ielts?: { id?: string };
  ieltsId?: string;
  title?: string | null;
  description?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  parts?: ApiPart[];
};

type ListeningPartBlueprint = {
  number: number;
  title: string;
  description: string;
  start: number;
  end: number;
  type: ListeningQuestionType;
  optionCount: number;
  sharedOptions: number;
};

const partBlueprints: ListeningPartBlueprint[] = [
  {
    number: 1,
    title: "Bölüm 1",
    description:
      "Sorular 1-8. Dinlediğiniz cümleleri tamamlayınız. Her cümleye cevap olabilecek en doğru seçeneği (A, B veya C) işaretleyiniz.",
    start: 1,
    end: 8,
    type: "MULTIPLE_CHOICE",
    optionCount: 3,
    sharedOptions: 0,
  },
  {
    number: 2,
    title: "Bölüm 2",
    description:
      "Sorular 9-14. Dinlediğiniz metne göre aşağıdaki cümleler için Doğru veya Yanlış seçeneklerinden birini işaretleyiniz.",
    start: 9,
    end: 14,
    type: "TRUE_FALSE",
    optionCount: 2,
    sharedOptions: 0,
  },
  {
    number: 3,
    title: "Bölüm 3",
    description:
      "Sorular 15-18. Konuşmacıların anlattığı durumları uygun seçeneklerle (A-F) eşleştiriniz. Seçilmeyecek iki seçenek vardır.",
    start: 15,
    end: 18,
    type: "MATCHING",
    optionCount: 6,
    sharedOptions: 6,
  },
  {
    number: 4,
    title: "Bölüm 4",
    description:
      "Sorular 19-23. Dinleme metnine göre haritadaki yerleri (A-H) eşleştiriniz. Seçilmeyecek üç seçenek vardır.",
    start: 19,
    end: 23,
    type: "MATCHING",
    optionCount: 8,
    sharedOptions: 8,
  },
  {
    number: 5,
    title: "Bölüm 5",
    description:
      "Sorular 24-29. Soruları okuyunuz ve dinleme metnine göre doğru seçeneği (A, B veya C) işaretleyiniz.",
    start: 24,
    end: 29,
    type: "MULTIPLE_CHOICE",
    optionCount: 3,
    sharedOptions: 0,
  },
  {
    number: 6,
    title: "Bölüm 6",
    description:
      "Sorular 30-35. Dinleme metnine göre doğru seçeneği (A, B veya C) işaretleyiniz.",
    start: 30,
    end: 35,
    type: "MULTIPLE_CHOICE",
    optionCount: 3,
    sharedOptions: 0,
  },
];

const letters = (count: number) =>
  Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index));

export const getListeningDialogueLabel = (questionNumber: number) => {
  if (questionNumber >= 24 && questionNumber <= 25) return "1. diyalog";
  if (questionNumber >= 26 && questionNumber <= 27) return "2. diyalog";
  if (questionNumber >= 28 && questionNumber <= 29) return "3. diyalog";
  return null;
};

export const getListeningFixedQuestionPrompt = (
  partNumber: number,
  questionNumber: number,
): string | null => {
  if (partNumber === 1) return "";
  if (partNumber === 3) return `${questionNumber - 14}. konuşmacı ...`;
  return null;
};

export const isListeningQuestionPromptEditable = (partNumber: number) =>
  partNumber !== 1 && partNumber !== 3;

export const isSingleUseListeningPart = (partNumber: number) =>
  partNumber === 3 || partNumber === 4;

export const isListeningMapMatchingPart = (partNumber: number) =>
  partNumber === 4;

const createOptions = (count: number): ListeningOptionDraft[] =>
  letters(count).map((variant) => ({ variant, text: "" }));

const createPartOptionBank = (
  partNumber: number,
  optionCount: number,
): ListeningOptionDraft[] =>
  createOptions(optionCount).map((option) =>
    isListeningMapMatchingPart(partNumber)
      ? { ...option, text: option.variant }
      : option,
  );

const createQuestion = (
  partNumber: number,
  number: number,
  type: ListeningQuestionType,
  optionCount: number,
): ListeningQuestionDraft => {
  const options =
    type === "TRUE_FALSE"
      ? [
          { variant: "A", text: "Doğru" },
          { variant: "B", text: "Yanlış" },
        ]
      : createOptions(optionCount);

  return {
    key: `part-${partNumber}-question-${number}`,
    number,
    type,
    prompt: getListeningFixedQuestionPrompt(partNumber, number) ?? "",
    options,
    correctVariant: "",
  };
};

export const createOfficialListeningDraft = ({
  ieltsId,
  title = "",
}: CreateDraftInput): OfficialListeningDraft => ({
  ieltsId,
  title,
  description: OFFICIAL_LISTENING_MARKER,
  audioUrl: "",
  audioDurationSeconds: null,
  parts: partBlueprints.map((blueprint) => ({
    key: `part-${blueprint.number}`,
    number: blueprint.number,
    title: blueprint.title,
    description: blueprint.description,
    transcript: "",
    transcriptFormatted: "",
    imageUrl: "",
    optionBank: createPartOptionBank(
      blueprint.number,
      blueprint.sharedOptions,
    ),
    questions: Array.from(
      { length: blueprint.end - blueprint.start + 1 },
      (_, index) =>
        createQuestion(
          blueprint.number,
          blueprint.start + index,
          blueprint.type,
          blueprint.optionCount,
        ),
    ),
  })),
});

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const getListeningEvidenceSpans = (
  evidence: ListeningEvidenceDraft | undefined,
): ListeningEvidenceSpanDraft[] => {
  if (!evidence) return [];
  if (
    Array.isArray(evidence.evidenceSpans) &&
    evidence.evidenceSpans.length > 0
  ) {
    return evidence.evidenceSpans;
  }
  return hasText(evidence.evidenceText)
    ? [
        {
          evidenceText: evidence.evidenceText,
          textStart: evidence.textStart,
          textEnd: evidence.textEnd,
        },
      ]
    : [];
};

export const withListeningEvidenceSpans = (
  spans: ListeningEvidenceSpanDraft[],
  current?: Partial<ListeningEvidenceDraft>,
): ListeningEvidenceDraft | undefined => {
  const [first] = spans;
  if (!first && !current) return undefined;
  return {
    ...(first ?? { evidenceText: "", textStart: 0, textEnd: 0 }),
    explanation: String(current?.explanation ?? ""),
    audioStartMs: Number(current?.audioStartMs ?? 0),
    audioEndMs: Number(current?.audioEndMs ?? 0),
    evidenceSpans: spans,
  };
};

const sourceRangeMatches = (
  source: string,
  evidence: ListeningEvidenceSpanDraft | undefined,
) =>
  Boolean(
    evidence &&
    hasText(evidence.evidenceText) &&
    Number.isInteger(evidence.textStart) &&
    Number.isInteger(evidence.textEnd) &&
    evidence.textStart >= 0 &&
    evidence.textEnd > evidence.textStart &&
    evidence.textEnd <= source.length &&
    source.slice(evidence.textStart, evidence.textEnd) ===
      evidence.evidenceText,
  );

const issue = (
  code: ListeningValidationIssue["code"],
  field: ListeningValidationField,
  partNumber: number,
  questionNumber: number | null,
  message: string,
): ListeningValidationIssue => ({
  code,
  field,
  partNumber,
  questionNumber,
  message,
});

const optionsForQuestion = (
  part: ListeningPartDraft,
  question: ListeningQuestionDraft,
) => (part.optionBank.length > 0 ? part.optionBank : question.options);

export const validateOfficialListeningDraft = (
  draft: OfficialListeningDraft,
): ListeningValidationResult => {
  const issues: ListeningValidationIssue[] = [];
  const partProgress: ListeningValidationResult["partProgress"] = {};
  const audioDurationMs = Number(draft.audioDurationSeconds) * 1000;
  let completedQuestions = 0;

  if (!hasText(draft.title)) {
    issues.push(issue("TITLE_REQUIRED", "title", 1, null, "Test adını yazın."));
  }
  if (!hasText(draft.audioUrl)) {
    issues.push(
      issue(
        "AUDIO_REQUIRED",
        "audio",
        1,
        null,
        "Tek ana ses dosyasını yükleyin.",
      ),
    );
  }
  if (!Number.isFinite(audioDurationMs) || audioDurationMs <= 0) {
    issues.push(
      issue(
        "AUDIO_DURATION_REQUIRED",
        "audio",
        1,
        null,
        "Ses süresi okunamadı. Dosyayı yeniden yükleyin.",
      ),
    );
  }

  for (const part of draft.parts) {
    let partCompleted = 0;
    const usedCorrectVariants = new Set<string>();

    if (!hasText(part.description)) {
      issues.push(
        issue(
          "INSTRUCTION_REQUIRED",
          "instruction",
          part.number,
          null,
          "Bölüm yönergesini yazın.",
        ),
      );
    }
    if (!hasText(part.transcript)) {
      issues.push(
        issue(
          "TRANSCRIPT_REQUIRED",
          "transcript",
          part.number,
          null,
          "Bölüm transcriptini yazın.",
        ),
      );
    }
    if (part.number === 4 && !hasText(part.imageUrl)) {
      issues.push(
        issue(
          "IMAGE_REQUIRED",
          "image",
          part.number,
          null,
          "Harita veya plan görselini yükleyin.",
        ),
      );
    }

    for (const question of part.questions) {
      const questionIssueCount = issues.length;
      const options = optionsForQuestion(part, question);

      if (
        isListeningQuestionPromptEditable(part.number) &&
        !hasText(question.prompt)
      ) {
        issues.push(
          issue(
            "QUESTION_REQUIRED",
            "prompt",
            part.number,
            question.number,
            "Soru metnini yazın.",
          ),
        );
      }
      if (
        options.length === 0 ||
        options.some(
          (option) =>
            !hasText(option.variant) ||
            (!isListeningMapMatchingPart(part.number) &&
              !hasText(option.text)),
        )
      ) {
        issues.push(
          issue(
            "OPTIONS_REQUIRED",
            "options",
            part.number,
            question.number,
            "Bütün seçenekleri doldurun.",
          ),
        );
      }
      if (
        !hasText(question.correctVariant) ||
        !options.some((option) => option.variant === question.correctVariant)
      ) {
        issues.push(
          issue(
            "CORRECT_ANSWER_REQUIRED",
            "correctAnswer",
            part.number,
            question.number,
            "Doğru cevabı seçin.",
          ),
        );
      } else if (isSingleUseListeningPart(part.number)) {
        if (usedCorrectVariants.has(question.correctVariant)) {
          issues.push(
            issue(
              "DUPLICATE_CORRECT_ANSWER",
              "correctAnswer",
              part.number,
              question.number,
              "Bu seçenek bu bölümde başka bir sorunun doğru cevabı olarak kullanılmış.",
            ),
          );
        } else {
          usedCorrectVariants.add(question.correctVariant);
        }
      }

      const evidenceSpans = getListeningEvidenceSpans(question.evidence);
      if (evidenceSpans.length === 0 && ![1, 5].includes(part.number)) {
        issues.push(
          issue(
            "EVIDENCE_REQUIRED",
            "evidence",
            part.number,
            question.number,
            "Transcript üzerinden kanıt seçin.",
          ),
        );
      } else if (
        evidenceSpans.some(
          (evidence) => !sourceRangeMatches(part.transcript, evidence),
        )
      ) {
        issues.push(
          issue(
            "EVIDENCE_SOURCE_MISMATCH",
            "evidence",
            part.number,
            question.number,
            "Transcript değişti. Kanıtı yeniden seçin.",
          ),
        );
      }
      if (!question.evidence || !hasText(question.evidence.explanation)) {
        issues.push(
          issue(
            "EXPLANATION_REQUIRED",
            "explanation",
            part.number,
            question.number,
            "Doğru cevabın nedenini kısaca yazın.",
          ),
        );
      }

      if (issues.length === questionIssueCount) {
        completedQuestions += 1;
        partCompleted += 1;
      }
    }

    partProgress[part.number] = {
      completed: partCompleted,
      total: part.questions.length,
    };
  }

  return {
    ready: issues.length === 0 && completedQuestions === 35,
    issues,
    completedQuestions,
    totalQuestions: 35,
    partProgress,
  };
};

const answerPayload = (
  options: ListeningOptionDraft[],
  question: ListeningQuestionDraft,
  partNumber: number,
) =>
  options.map((option) => ({
    ...(question.answerIdsByVariant?.[option.variant]
      ? { id: question.answerIdsByVariant[option.variant] }
      : {}),
    variantText: option.variant,
    answer: isListeningMapMatchingPart(partNumber)
      ? option.variant
      : option.text,
    correct: option.variant === question.correctVariant,
  }));

const asApiEvidence = (
  _transcript: string,
  evidence: ListeningEvidenceDraft | undefined,
) => {
  if (!evidence) return null;
  const evidenceSpans = getListeningEvidenceSpans(evidence).map((span) => ({
    evidenceText: span.evidenceText,
    textStart: span.textStart,
    textEnd: span.textEnd,
  }));
  const first = evidenceSpans[0];
  return {
    ...(first ?? { evidenceText: "", textStart: 0, textEnd: 0 }),
    explanation: evidence.explanation,
    evidenceSpans,
    audioStartMs: Math.round(evidence.audioStartMs),
    audioEndMs: Math.round(evidence.audioEndMs),
  };
};

export const serializeOfficialListeningDraft = (
  draft: OfficialListeningDraft,
) => ({
  title: draft.title.trim(),
  description: OFFICIAL_LISTENING_MARKER,
  type: "LISTENING",
  ieltsId: draft.ieltsId,
  audioUrl: draft.audioUrl,
  audioDurationSeconds: draft.audioDurationSeconds
    ? Math.ceil(draft.audioDurationSeconds)
    : undefined,
  parts: draft.parts.map((part) => ({
    ...(part.apiId ? { id: part.apiId } : {}),
    number: part.number,
    title: part.title,
    description: part.description.trim(),
    audioUrl: draft.audioUrl,
    sections: [
      {
        ...(part.sectionApiId ? { id: part.sectionApiId } : {}),
        title: `${part.title} transcripti`,
        content: part.transcriptFormatted || part.transcript,
        transcript: part.transcript,
        imageUrl: part.imageUrl,
        questions: part.questions.map((question) => {
          const prompt =
            getListeningFixedQuestionPrompt(part.number, question.number) ??
            question.prompt;

          return {
            ...(question.apiId ? { id: question.apiId } : {}),
            number: question.number,
            type: question.type,
            text: prompt,
            content: prompt,
            imageUrl: part.number === 4 ? part.imageUrl : "",
            answers: answerPayload(
              part.optionBank.length > 0 ? part.optionBank : question.options,
              question,
              part.number,
            ),
            evidence: asApiEvidence(part.transcript, question.evidence),
          };
        }),
      },
    ],
  })),
});

const apiOptions = (answers: ApiAnswer[] = []): ListeningOptionDraft[] =>
  answers.map((answer, index) => ({
    apiId: answer.id,
    variant:
      (typeof answer.variantText === "string" && answer.variantText.trim()) ||
      String.fromCharCode(65 + index),
    text: String(answer.displayText ?? answer.answer ?? ""),
  }));

const mergeOfficialOptions = (
  officialOptions: ListeningOptionDraft[],
  answers: ApiAnswer[] = [],
): ListeningOptionDraft[] => {
  const savedByVariant = new Map(
    apiOptions(answers).map((option) => [option.variant, option]),
  );

  return officialOptions.map((officialOption) => {
    const savedOption = savedByVariant.get(officialOption.variant);
    return {
      ...officialOption,
      ...(savedOption?.apiId ? { apiId: savedOption.apiId } : {}),
      text: officialOption.text || savedOption?.text || "",
    };
  });
};

const apiCorrectVariant = (answers: ApiAnswer[] = []) => {
  const correctIndex = answers.findIndex((answer) => answer.correct);
  return correctIndex >= 0
    ? (apiOptions(answers)[correctIndex]?.variant ?? "")
    : "";
};

const normalizeAnswerIds = (answers: ApiAnswer[] = []) =>
  Object.fromEntries(
    apiOptions(answers)
      .filter((option) => option.apiId)
      .map((option) => [option.variant, String(option.apiId)]),
  );

const normalizeEvidence = (
  evidence: ApiEvidence | undefined,
  transcript: string,
): ListeningEvidenceDraft | undefined => {
  if (!evidence) return undefined;
  const rawSpans =
    Array.isArray(evidence.evidenceSpans) && evidence.evidenceSpans.length > 0
      ? evidence.evidenceSpans
      : [evidence];
  const spans = rawSpans.flatMap<ListeningEvidenceSpanDraft>((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const candidate = raw as Partial<ListeningEvidenceSpanDraft>;
    if (!hasText(candidate.evidenceText)) return [];
    const evidenceText = String(candidate.evidenceText);
    const textStart = typeof candidate.textStart === "number"
      ? candidate.textStart
      : transcript.indexOf(evidenceText);
    const textEnd = typeof candidate.textEnd === "number"
      ? candidate.textEnd
      : textStart + evidenceText.length;
    return [
      {
        evidenceText,
        textStart,
        textEnd,
      },
    ];
  });
  const normalized = withListeningEvidenceSpans(spans, {
    explanation: evidence.explanation,
    audioStartMs: evidence.audioStartMs,
    audioEndMs: evidence.audioEndMs,
  });
  return normalized;
};

export const hydrateOfficialListeningDraft = (
  test: ApiListeningTest,
  fallbackIeltsId = "",
): OfficialListeningDraft => {
  const draft = createOfficialListeningDraft({
    ieltsId: String(test.ieltsId ?? test.ielts?.id ?? fallbackIeltsId),
    title: String(test.title ?? ""),
  });
  draft.testId = test.id;
  draft.status = test.status;
  draft.publishedAt = test.publishedAt;
  draft.contentRevision = test.contentRevision;
  draft.audioUrl = String(
    test.audioUrl ??
      test.parts?.find((part) => hasText(part.audioUrl))?.audioUrl ??
      "",
  );
  const duration = Number(test.audioDurationSeconds);
  draft.audioDurationSeconds =
    Number.isFinite(duration) && duration > 0 ? duration : null;

  for (const targetPart of draft.parts) {
    const sourcePart =
      test.parts?.find((part) => Number(part.number) === targetPart.number) ??
      test.parts?.[targetPart.number - 1];
    if (!sourcePart) continue;

    targetPart.apiId = sourcePart.id;
    if (hasText(sourcePart.description)) {
      targetPart.description = sourcePart.description;
    }
    const sourceSection =
      sourcePart.sections?.find(
        (section) => (section.questions?.length ?? 0) > 0,
      ) ?? sourcePart.sections?.[0];
    targetPart.sectionApiId = sourceSection?.id;
    targetPart.transcript = String(sourceSection?.transcript ?? "");
    targetPart.transcriptFormatted = String(
      sourceSection?.content ?? sourceSection?.transcript ?? "",
    );
    targetPart.imageUrl = String(sourceSection?.imageUrl ?? "");
    const sourceQuestions = [...(sourceSection?.questions ?? [])].sort(
      (left, right) => Number(left.number ?? 0) - Number(right.number ?? 0),
    );

    targetPart.questions.forEach((targetQuestion, index) => {
      const sourceQuestion =
        sourceQuestions.find(
          (question) => Number(question.number) === targetQuestion.number,
        ) ?? sourceQuestions[index];
      if (!sourceQuestion) return;
      targetQuestion.apiId = sourceQuestion.id;
      targetQuestion.prompt =
        getListeningFixedQuestionPrompt(
          targetPart.number,
          targetQuestion.number,
        ) ?? String(sourceQuestion.text ?? sourceQuestion.content ?? "");
      targetQuestion.options = mergeOfficialOptions(
        targetQuestion.options,
        sourceQuestion.answers,
      );
      targetQuestion.correctVariant = apiCorrectVariant(sourceQuestion.answers);
      targetQuestion.answerIdsByVariant = normalizeAnswerIds(
        sourceQuestion.answers,
      );
      targetQuestion.evidence = normalizeEvidence(
        sourceQuestion.evidence,
        targetPart.transcript,
      );
    });

    if (targetPart.optionBank.length > 0) {
      const firstAnswers = sourceQuestions[0]?.answers ?? [];
      if (firstAnswers.length > 0) {
        targetPart.optionBank = mergeOfficialOptions(
          targetPart.optionBank,
          firstAnswers,
        );
      }
    }
  }

  return draft;
};

/** Timings belong to a particular recording, transcript and selected quotation. */
export const invalidateListeningEvidenceTiming = (
  previous: OfficialListeningDraft,
  next: OfficialListeningDraft,
): OfficialListeningDraft => ({
  ...next,
  parts: next.parts.map((part) => {
    const oldPart = previous.parts.find((candidate) => candidate.number === part.number);
    const sourceChanged = previous.audioUrl !== next.audioUrl || oldPart?.transcript !== part.transcript;
    return {
      ...part,
      questions: part.questions.map((question) => {
        const oldQuestion = oldPart?.questions.find((candidate) => candidate.number === question.number);
        const nextSpans = getListeningEvidenceSpans(question.evidence);
        const selectionChanged = !([1, 5].includes(part.number) && nextSpans.length === 0) &&
          JSON.stringify(getListeningEvidenceSpans(oldQuestion?.evidence)) !== JSON.stringify(nextSpans);
        return question.evidence && (sourceChanged || selectionChanged)
          ? { ...question, evidence: { ...question.evidence, audioStartMs: 0, audioEndMs: 0 } }
          : question;
      }),
    };
  }),
});
