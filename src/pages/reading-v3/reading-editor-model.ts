import officialReadingInstructions from "@/data/official-reading-instructions.json";
export const OFFICIAL_READING_MARKER = "TM_READING_OFFICIAL_V1";

export type ReadingQuestionType =
  | "FILL_BLANK"
  | "MATCHING"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE";

export type ReadingOptionDraft = {
  apiId?: string;
  variant: string;
  text: string;
};

export type ReadingEvidenceSpanDraft = {
  evidenceText: string;
  textStart: number;
  textEnd: number;
};

export type ReadingEvidenceDraft = ReadingEvidenceSpanDraft & {
  explanation: string;
  evidenceSpans?: ReadingEvidenceSpanDraft[];
};

export type ReadingQuestionDraft = {
  key: string;
  apiId?: string;
  sectionApiId?: string;
  number: number;
  type: ReadingQuestionType;
  prompt: string;
  sourceTitle: string;
  sourceText: string;
  imageUrl?: string;
  options: ReadingOptionDraft[];
  correctVariant: string;
  evidence?: ReadingEvidenceDraft;
  answerIdsByVariant?: Record<string, string>;
};

export type ReadingPartDraft = {
  key: string;
  apiId?: string;
  number: number;
  title: string;
  description: string;
  sourceTitle: string;
  sourceText: string;
  sectionApiId?: string;
  optionBank: ReadingOptionDraft[];
  questions: ReadingQuestionDraft[];
};

export type OfficialReadingDraft = {
  testId?: string;
  status?: "DRAFT" | "PUBLISHED";
  contentRevision?: number;
  publishedAt?: string | null;
  ieltsId: string;
  title: string;
  description: string;
  parts: ReadingPartDraft[];
};

export type ReadingValidationField =
  | "title"
  | "sourceTitle"
  | "sourceText"
  | "prompt"
  | "options"
  | "correctAnswer"
  | "evidence"
  | "explanation";

export type ReadingValidationIssue = {
  code:
    | "TITLE_REQUIRED"
    | "SOURCE_TITLE_REQUIRED"
    | "SOURCE_TEXT_REQUIRED"
    | "QUESTION_REQUIRED"
    | "OPTIONS_REQUIRED"
    | "CORRECT_ANSWER_REQUIRED"
    | "CORRECT_ANSWER_REUSED"
    | "EVIDENCE_REQUIRED"
    | "EXPLANATION_REQUIRED"
    | "EVIDENCE_SOURCE_MISMATCH"
    | "BLANK_MARKER_REQUIRED";
  field: ReadingValidationField;
  partNumber: number;
  questionNumber: number | null;
  message: string;
};

export type ReadingValidationResult = {
  ready: boolean;
  issues: ReadingValidationIssue[];
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
  | (Partial<ReadingEvidenceDraft> & { evidenceSpans?: unknown })
  | null;

type ApiQuestion = {
  id?: string;
  number?: number;
  type?: ReadingQuestionType;
  text?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  answers?: ApiAnswer[];
  evidence?: ApiEvidence;
};

type ApiSection = {
  id?: string;
  title?: string | null;
  content?: string | null;
  questions?: ApiQuestion[];
};

type ApiPart = {
  id?: string;
  number?: number;
  title?: string | null;
  description?: string | null;
  sections?: ApiSection[];
};

type ApiReadingTest = {
  id?: string;
  status?: "DRAFT" | "PUBLISHED";
  contentRevision?: number;
  publishedAt?: string | null;
  ieltsId?: string;
  ielts?: { id?: string };
  title?: string | null;
  description?: string | null;
  parts?: ApiPart[];
};

const letters = (count: number) =>
  Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index));

const createOptions = (count: number): ReadingOptionDraft[] =>
  letters(count).map((variant) => ({ variant, text: "" }));

const createQuestion = (
  partNumber: number,
  number: number,
  type: ReadingQuestionType,
  optionCount: number,
): ReadingQuestionDraft => ({
  key: `part-${partNumber}-question-${number}`,
  number,
  type,
  prompt: "",
  sourceTitle: "",
  sourceText: "",
  options: createOptions(optionCount),
  correctVariant: "",
});

const partBlueprints = [
  {
    number: 1,
    title: "Bölüm 1",
    description: officialReadingInstructions.parts["1"],
    start: 1,
    end: 6,
    type: "FILL_BLANK" as const,
    optionCount: 8,
    sharedOptions: 8,
  },
  {
    number: 2,
    title: "Bölüm 2",
    description: officialReadingInstructions.parts["2"],
    start: 7,
    end: 14,
    type: "MATCHING" as const,
    optionCount: 10,
    sharedOptions: 10,
  },
  {
    number: 3,
    title: "Bölüm 3",
    description: officialReadingInstructions.parts["3"],
    start: 15,
    end: 20,
    type: "MATCHING" as const,
    optionCount: 8,
    sharedOptions: 8,
  },
  {
    number: 4,
    title: "Bölüm 4",
    description: officialReadingInstructions.parts["4"],
    start: 21,
    end: 29,
    type: "MULTIPLE_CHOICE" as const,
    optionCount: 4,
    sharedOptions: 0,
  },
  {
    number: 5,
    title: "Bölüm 5",
    description: officialReadingInstructions.parts["5"],
    start: 30,
    end: 35,
    type: "MULTIPLE_CHOICE" as const,
    optionCount: 4,
    sharedOptions: 0,
  },
] as const;

const questionTypeFor = (
  partNumber: number,
  questionNumber: number,
): ReadingQuestionType => {
  if (partNumber === 4 && questionNumber >= 25) return "TRUE_FALSE";
  if (partNumber === 5 && questionNumber >= 33) return "MATCHING";
  return partBlueprints[partNumber - 1].type;
};

const optionCountFor = (partNumber: number, questionNumber: number) => {
  if (partNumber === 4 && questionNumber >= 25) return 3;
  if (partNumber === 5 && questionNumber >= 33) return 5;
  return partBlueprints[partNumber - 1].optionCount;
};

const withFixedOptions = (
  partNumber: number,
  questionNumber: number,
  question: ReadingQuestionDraft,
) => {
  if (partNumber === 4 && questionNumber >= 25) {
    question.options = [
      { variant: "A", text: "Doğru" },
      { variant: "B", text: "Yanlış" },
      { variant: "C", text: "Verilmemiş" },
    ];
  }
  if (partNumber === 5 && questionNumber >= 33) {
    question.options = letters(5).map((variant) => ({
      variant,
      text: `${variant} paragrafı`,
    }));
  }
  return question;
};

export const createOfficialReadingDraft = ({
  ieltsId,
  title = "",
}: CreateDraftInput): OfficialReadingDraft => ({
  ieltsId,
  title,
  description: OFFICIAL_READING_MARKER,
  parts: partBlueprints.map((blueprint) => ({
    key: `part-${blueprint.number}`,
    number: blueprint.number,
    title: blueprint.title,
    description: blueprint.description,
    sourceTitle: "",
    sourceText: "",
    optionBank: createOptions(blueprint.sharedOptions),
    questions: Array.from(
      { length: blueprint.end - blueprint.start + 1 },
      (_, index) => {
        const number = blueprint.start + index;
        return withFixedOptions(
          blueprint.number,
          number,
          createQuestion(
            blueprint.number,
            number,
            questionTypeFor(blueprint.number, number),
            optionCountFor(blueprint.number, number),
          ),
        );
      },
    ),
  })),
});

export const getQuestionSource = (
  part: ReadingPartDraft,
  question: ReadingQuestionDraft,
) => (part.number === 2 || part.number === 3 ? question.sourceText : part.sourceText);

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const getReadingEvidenceSpans = (
  evidence: ReadingEvidenceDraft | undefined,
): ReadingEvidenceSpanDraft[] => {
  if (!evidence) return [];
  if (Array.isArray(evidence.evidenceSpans) && evidence.evidenceSpans.length > 0) {
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

export const withReadingEvidenceSpans = (
  spans: ReadingEvidenceSpanDraft[],
  explanation: string,
): ReadingEvidenceDraft | undefined => {
  const [first] = spans;
  if (!first && !hasText(explanation)) return undefined;
  return {
    ...(first ?? { evidenceText: "", textStart: 0, textEnd: 0 }),
    explanation,
    evidenceSpans: spans,
  };
};

const sourceRangeMatches = (
  source: string,
  evidence: ReadingEvidenceSpanDraft | undefined,
) =>
  Boolean(
    evidence &&
      hasText(evidence.evidenceText) &&
      Number.isInteger(evidence.textStart) &&
      Number.isInteger(evidence.textEnd) &&
      evidence.textStart >= 0 &&
      evidence.textEnd > evidence.textStart &&
      evidence.textEnd <= source.length &&
      source.slice(evidence.textStart, evidence.textEnd) === evidence.evidenceText,
  );

const issue = (
  code: ReadingValidationIssue["code"],
  field: ReadingValidationField,
  partNumber: number,
  questionNumber: number | null,
  message: string,
): ReadingValidationIssue => ({
  code,
  field,
  partNumber,
  questionNumber,
  message,
});

const requiredOptionsForQuestion = (
  part: ReadingPartDraft,
  question: ReadingQuestionDraft,
) => (part.optionBank.length > 0 ? part.optionBank : question.options);

export const validateOfficialReadingDraft = (
  draft: OfficialReadingDraft,
): ReadingValidationResult => {
  const issues: ReadingValidationIssue[] = [];
  const partProgress: ReadingValidationResult["partProgress"] = {};
  let completedQuestions = 0;

  if (!hasText(draft.title)) {
    issues.push(issue("TITLE_REQUIRED", "title", 1, null, "Test adını yazın."));
  }

  for (const part of draft.parts) {
    let partCompleted = 0;
    const correctVariantCounts = new Map<string, number>();
    if ([1, 2, 3].includes(part.number)) {
      part.questions.forEach(({ correctVariant }) => {
        if (hasText(correctVariant)) {
          correctVariantCounts.set(
            correctVariant,
            (correctVariantCounts.get(correctVariant) ?? 0) + 1,
          );
        }
      });
    }

    if ([1, 4, 5].includes(part.number)) {
      if (!hasText(part.sourceTitle)) {
        issues.push(
          issue(
            "SOURCE_TITLE_REQUIRED",
            "sourceTitle",
            part.number,
            null,
            "Metin başlığını yazın.",
          ),
        );
      }
      if (!hasText(part.sourceText)) {
        issues.push(
          issue(
            "SOURCE_TEXT_REQUIRED",
            "sourceText",
            part.number,
            null,
            "Okuma metnini yazın.",
          ),
        );
      }
    }

    for (const question of part.questions) {
      const questionIssuesBefore = issues.length;
      const source = getQuestionSource(part, question);
      const options = requiredOptionsForQuestion(part, question);

      if (part.number === 2 && !hasText(question.sourceTitle)) {
        issues.push(
          issue(
            "SOURCE_TITLE_REQUIRED",
            "sourceTitle",
            part.number,
            question.number,
            "Kart başlığını yazın.",
          ),
        );
      }
      if ((part.number === 2 || part.number === 3) && !hasText(question.sourceText)) {
        issues.push(
          issue(
            "SOURCE_TEXT_REQUIRED",
            "sourceText",
            part.number,
            question.number,
            part.number === 2 ? "Kart metnini yazın." : "Paragraf metnini yazın.",
          ),
        );
      }
      if (
        (part.number === 4 || part.number === 5) &&
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
        options.some((option) => !hasText(option.variant) || !hasText(option.text))
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
      }
      if ((correctVariantCounts.get(question.correctVariant) ?? 0) > 1) {
        issues.push(
          issue(
            "CORRECT_ANSWER_REUSED",
            "correctAnswer",
            part.number,
            question.number,
            `${question.correctVariant} seçeneği bu bölümde yalnızca bir sorunun doğru cevabı olabilir.`,
          ),
        );
      }
      const evidenceSpans = getReadingEvidenceSpans(question.evidence);
      if (evidenceSpans.length === 0 && part.number !== 1) {
        issues.push(
          issue(
            "EVIDENCE_REQUIRED",
            "evidence",
            part.number,
            question.number,
            "Metin üzerinden kanıt seçin.",
          ),
        );
      } else if (
        evidenceSpans.some((evidence) => !sourceRangeMatches(source, evidence))
      ) {
        issues.push(
          issue(
            "EVIDENCE_SOURCE_MISMATCH",
            "evidence",
            part.number,
            question.number,
            "Metin değişti. Kanıtı yeniden seçin.",
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

      if (part.number === 1) {
        const marker = new RegExp(`_{3,}\\s*\\(S${question.number}\\)`);
        if (!marker.test(part.sourceText)) {
          issues.push(
            issue(
              "BLANK_MARKER_REQUIRED",
              "sourceText",
              part.number,
              question.number,
              `Metinde S${question.number} boşluğunu ekleyin.`,
            ),
          );
        }
      }

      if (issues.length === questionIssuesBefore) {
        partCompleted += 1;
        completedQuestions += 1;
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

const asApiEvidence = (
  _source: string,
  evidence: ReadingEvidenceDraft | undefined,
  sourceOffset = 0,
) => {
  if (!evidence) return null;
  const evidenceSpans = getReadingEvidenceSpans(evidence).map((span) => ({
    evidenceText: span.evidenceText,
    textStart: span.textStart + sourceOffset,
    textEnd: span.textEnd + sourceOffset,
  }));
  const first = evidenceSpans[0];
  return {
    ...(first ?? { evidenceText: "", textStart: 0, textEnd: 0 }),
    explanation: evidence.explanation,
    evidenceSpans,
  };
};

const answerPayload = (
  options: ReadingOptionDraft[],
  question: ReadingQuestionDraft,
) =>
  options.map((option) => ({
    ...(question.answerIdsByVariant?.[option.variant]
      ? { id: question.answerIdsByVariant[option.variant] }
      : {}),
    variantText: option.variant,
    answer: option.text,
    correct: option.variant === question.correctVariant,
  }));

const questionPayload = (
  question: ReadingQuestionDraft,
  options: ReadingOptionDraft[],
  source: string,
  evidenceOffset = 0,
) => ({
  ...(question.apiId ? { id: question.apiId } : {}),
  number: question.number,
  type: question.type,
  text: question.prompt,
  content: question.prompt,
  ...(question.imageUrl ? { imageUrl: question.imageUrl } : {}),
  answers: answerPayload(options, question),
  evidence: asApiEvidence(source, question.evidence, evidenceOffset),
});

const combinePartThreeSource = (part: ReadingPartDraft) =>
  part.questions
    .map((question, index) => {
      const roman = ["I", "II", "III", "IV", "V", "VI"][index];
      return `${roman}. ${question.sourceText}`.trim();
    })
    .join("\n\n");

export const serializeOfficialReadingDraft = (draft: OfficialReadingDraft) => ({
  title: draft.title.trim(),
  description: OFFICIAL_READING_MARKER,
  type: "READING",
  ieltsId: draft.ieltsId,
  parts: draft.parts.map((part) => {
    if (part.number === 2) {
      return {
        ...(part.apiId ? { id: part.apiId } : {}),
        number: part.number,
        title: part.title,
        description: officialReadingInstructions.parts[String(part.number) as keyof typeof officialReadingInstructions.parts],
        audioUrl: "",
        sections: part.questions.map((question) => ({
          ...(question.sectionApiId ? { id: question.sectionApiId } : {}),
          title: question.sourceTitle,
          content: question.sourceText,
          imageUrl: question.imageUrl || "",
          questions: [
            {
              ...questionPayload(
                question,
                part.optionBank,
                question.sourceText,
              ),
              text: question.sourceTitle,
              content: question.sourceText,
            },
          ],
        })),
      };
    }

    if (part.number === 3) {
      const content = combinePartThreeSource(part);
      let cursor = 0;
      const questions = part.questions.map((question) => {
        const sourceOffset = content.indexOf(question.sourceText, cursor);
        cursor = Math.max(cursor, sourceOffset + question.sourceText.length);
        return {
          ...questionPayload(
            question,
            part.optionBank,
            question.sourceText,
            Math.max(0, sourceOffset),
          ),
          text: question.sourceText,
          content: question.sourceText,
        };
      });
      return {
        ...(part.apiId ? { id: part.apiId } : {}),
        number: part.number,
        title: part.title,
        description: officialReadingInstructions.parts[String(part.number) as keyof typeof officialReadingInstructions.parts],
        audioUrl: "",
        sections: [
          {
            ...(part.sectionApiId ? { id: part.sectionApiId } : {}),
            title: "Başlık eşleştirme",
            content,
            imageUrl: "",
            questions,
          },
        ],
      };
    }

    return {
      ...(part.apiId ? { id: part.apiId } : {}),
      number: part.number,
      title: part.title,
      description: officialReadingInstructions.parts[String(part.number) as keyof typeof officialReadingInstructions.parts],
      audioUrl: "",
      sections: [
        {
          ...(part.sectionApiId ? { id: part.sectionApiId } : {}),
          title: part.sourceTitle,
          content: part.sourceText,
          imageUrl: "",
          questions: part.questions.map((question) =>
            questionPayload(
              question,
              part.optionBank.length > 0 ? part.optionBank : question.options,
              part.sourceText,
            ),
          ),
        },
      ],
    };
  }),
});

const normalizeAnswerIds = (answers: ApiAnswer[] = []) =>
  Object.fromEntries(
    answers
      .filter((answer) => answer.id && answer.variantText)
      .map((answer) => [String(answer.variantText), String(answer.id)]),
  );

const apiOptions = (answers: ApiAnswer[] = []): ReadingOptionDraft[] =>
  answers.map((answer, index) => ({
    apiId: answer.id,
    variant:
      (typeof answer.variantText === "string" && answer.variantText.trim()) ||
      String.fromCharCode(65 + index),
    text: String(answer.displayText ?? answer.answer ?? ""),
  }));

const apiCorrectVariant = (answers: ApiAnswer[] = []) =>
  String(answers.find((answer) => answer.correct)?.variantText ?? "");

const normalizeEvidence = (
  evidence: ApiEvidence | undefined,
  localSource: string,
  globalSource?: string,
  sourceOffset = 0,
): ReadingEvidenceDraft | undefined => {
  if (!evidence) return undefined;
  const rawSpans =
    Array.isArray(evidence.evidenceSpans) && evidence.evidenceSpans.length > 0
      ? evidence.evidenceSpans
      : [evidence];
  const spans = rawSpans.flatMap<ReadingEvidenceSpanDraft>((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const candidate = raw as Partial<ReadingEvidenceSpanDraft>;
    if (!hasText(candidate.evidenceText)) return [];
    const evidenceText = String(candidate.evidenceText);
    const storedStart = candidate.textStart;
    const storedEnd = candidate.textEnd;
    // Part 3 stores section-relative ranges. Translate the saved range back to
    // its paragraph, preserving the author's occurrence of repeated text.
    const start = typeof storedStart === "number"
      ? storedStart - (globalSource ? sourceOffset : 0)
      : localSource.indexOf(evidenceText);
    const end = typeof storedEnd === "number"
      ? storedEnd - (globalSource ? sourceOffset : 0)
      : start + evidenceText.length;
    return [
      {
        evidenceText,
        textStart: start,
        textEnd: end,
      },
    ];
  });
  return withReadingEvidenceSpans(
    spans,
    String(evidence.explanation ?? ""),
  );
};

const populateQuestion = (
  target: ReadingQuestionDraft,
  source: ApiQuestion | undefined,
  localSource: string,
  globalSource?: string,
  sourceOffset = 0,
) => {
  if (!source) return target;
  target.apiId = source.id;
  target.prompt = String(source.text ?? "");
  target.imageUrl = String(source.imageUrl ?? "");
  target.options = apiOptions(source.answers);
  target.correctVariant = apiCorrectVariant(source.answers);
  target.answerIdsByVariant = normalizeAnswerIds(source.answers);
  target.evidence = normalizeEvidence(source.evidence, localSource, globalSource, sourceOffset);
  return target;
};

export const hydrateOfficialReadingDraft = (
  test: ApiReadingTest,
  fallbackIeltsId = "",
): OfficialReadingDraft => {
  const draft = createOfficialReadingDraft({
    ieltsId: String(test.ieltsId ?? test.ielts?.id ?? fallbackIeltsId),
    title: String(test.title ?? ""),
  });
  draft.testId = test.id;
  draft.status = test.status;
  draft.contentRevision = test.contentRevision;
  draft.publishedAt = test.publishedAt;

  for (const targetPart of draft.parts) {
    const sourcePart =
      test.parts?.find((part) => Number(part.number) === targetPart.number) ??
      test.parts?.[targetPart.number - 1];
    if (!sourcePart) continue;

    targetPart.apiId = sourcePart.id;
    const sections = sourcePart.sections ?? [];
    const allQuestions = sections
      .flatMap((section) => section.questions ?? [])
      .sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0));

    if (targetPart.number === 2) {
      targetPart.questions.forEach((targetQuestion, index) => {
        const sourceSection =
          sections.find((section) =>
            section.questions?.some(
              (question) => Number(question.number) === targetQuestion.number,
            ),
          ) ?? sections[index];
        const sourceQuestion =
          sourceSection?.questions?.find(
            (question) => Number(question.number) === targetQuestion.number,
          ) ?? allQuestions[index];
        targetQuestion.sourceTitle = String(
          sourceQuestion?.text ?? sourceSection?.title ?? "",
        );
        targetQuestion.sourceText = String(
          sourceQuestion?.content ?? sourceSection?.content ?? "",
        );
        targetQuestion.sectionApiId = sourceSection?.id;
        populateQuestion(
          targetQuestion,
          sourceQuestion,
          targetQuestion.sourceText,
        );
      });
    } else if (targetPart.number === 3) {
      const sourceSection = sections.find(
        (section) => (section.questions?.length ?? 0) > 0,
      );
      targetPart.sectionApiId = sourceSection?.id;
      const globalSource = String(sourceSection?.content ?? "");
      let sourceCursor = 0;
      targetPart.questions.forEach((targetQuestion, index) => {
        const sourceQuestion =
          allQuestions.find(
            (question) => Number(question.number) === targetQuestion.number,
          ) ?? allQuestions[index];
        targetQuestion.sourceText = String(
          sourceQuestion?.text ?? sourceQuestion?.content ?? "",
        ).replace(/^[IVX]+\.\s*/, "");
        const sourceOffset = globalSource.indexOf(targetQuestion.sourceText, sourceCursor);
        if (sourceOffset >= 0) {
          sourceCursor = sourceOffset + targetQuestion.sourceText.length;
        }
        populateQuestion(
          targetQuestion,
          sourceQuestion,
          targetQuestion.sourceText,
          globalSource,
          sourceOffset >= 0 ? sourceOffset : 0,
        );
      });
    } else {
      const sourceSection =
        sections.find((section) => (section.questions?.length ?? 0) > 0) ??
        sections[0];
      targetPart.sectionApiId = sourceSection?.id;
      targetPart.sourceTitle = String(sourceSection?.title ?? "");
      targetPart.sourceText = String(sourceSection?.content ?? "");
      targetPart.questions.forEach((targetQuestion, index) => {
        const sourceQuestion =
          allQuestions.find(
            (question) => Number(question.number) === targetQuestion.number,
          ) ?? allQuestions[index];
        populateQuestion(
          targetQuestion,
          sourceQuestion,
          targetPart.sourceText,
        );
      });
    }

    const firstAnswers = allQuestions[0]?.answers ?? [];
    if (targetPart.optionBank.length > 0 && firstAnswers.length > 0) {
      targetPart.optionBank = apiOptions(firstAnswers);
    }
  }

  return draft;
};
