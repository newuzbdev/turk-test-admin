import { describe, expect, it } from "vitest";
import {
  createOfficialListeningDraft,
  getListeningDialogueLabel,
  getListeningFixedQuestionPrompt,
  hydrateOfficialListeningDraft,
  isListeningQuestionPromptEditable,
  isSingleUseListeningPart,
  serializeOfficialListeningDraft,
  validateOfficialListeningDraft,
} from "./listening-editor-model";

describe("official listening editor model", () => {
  it("creates the fixed six-part, 35-question national exam structure", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni dinleme testi",
    });

    expect(draft.parts.map((part) => part.questions.length)).toEqual([
      8, 6, 4, 5, 6, 6,
    ]);
    expect(
      draft.parts.flatMap((part) =>
        part.questions.map((question) => question.number),
      ),
    ).toEqual(Array.from({ length: 35 }, (_, index) => index + 1));
    expect(
      draft.parts[1].questions.every(
        (question) => question.type === "TRUE_FALSE",
      ),
    ).toBe(true);
    expect(draft.parts[2].optionBank).toHaveLength(6);
    expect(draft.parts[3].optionBank).toHaveLength(8);
    expect(draft.parts[3].optionBank).toEqual(
      "ABCDEFGH".split("").map((variant) => ({
        variant,
        text: variant,
      })),
    );
    expect(
      draft.parts[4].questions.every(
        (question) =>
          question.options.map((option) => option.variant).join("") === "ABC",
      ),
    ).toBe(true);
  });

  it("groups part five into three two-question dialogues", () => {
    expect([24, 25].map(getListeningDialogueLabel)).toEqual([
      "1. diyalog",
      "1. diyalog",
    ]);
    expect([26, 27].map(getListeningDialogueLabel)).toEqual([
      "2. diyalog",
      "2. diyalog",
    ]);
    expect([28, 29].map(getListeningDialogueLabel)).toEqual([
      "3. diyalog",
      "3. diyalog",
    ]);
    expect(getListeningDialogueLabel(30)).toBeNull();
  });

  it("uses direct choices in part one and fixed speaker labels in part three", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni dinleme testi",
    });

    expect(isListeningQuestionPromptEditable(1)).toBe(false);
    expect(draft.parts[0].questions[0].prompt).toBe("");
    expect(getListeningFixedQuestionPrompt(1, 1)).toBe("");

    expect(isListeningQuestionPromptEditable(3)).toBe(false);
    expect(draft.parts[2].questions.map((question) => question.prompt)).toEqual(
      [
        "1. konuşmacı ...",
        "2. konuşmacı ...",
        "3. konuşmacı ...",
        "4. konuşmacı ...",
      ],
    );

    expect(isListeningQuestionPromptEditable(2)).toBe(true);
    expect(getListeningFixedQuestionPrompt(2, 9)).toBeNull();
    expect(isSingleUseListeningPart(3)).toBe(true);
    expect(isSingleUseListeningPart(4)).toBe(true);
    expect(isSingleUseListeningPart(1)).toBe(false);
    expect(isSingleUseListeningPart(5)).toBe(false);
  });

  it("rejects repeated correct choices only in shared matching parts", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });

    draft.parts[2].questions[0].correctVariant = "A";
    draft.parts[2].questions[1].correctVariant = "A";
    draft.parts[4].questions[0].correctVariant = "A";
    draft.parts[4].questions[1].correctVariant = "A";

    const validation = validateOfficialListeningDraft(draft);

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "DUPLICATE_CORRECT_ANSWER",
        partNumber: 3,
        questionNumber: 16,
      }),
    );
    expect(validation.issues).not.toContainEqual(
      expect.objectContaining({
        code: "DUPLICATE_CORRECT_ANSWER",
        partNumber: 5,
      }),
    );
  });

  it("serializes map locations as letter answers without admin option text", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    const mapPart = draft.parts[3];
    mapPart.optionBank.forEach((option) => {
      option.text = "";
    });
    mapPart.questions[0].correctVariant = "C";

    const validation = validateOfficialListeningDraft(draft);
    const payload = serializeOfficialListeningDraft(draft);
    const firstMapQuestion = payload.parts[3].sections[0].questions[0];

    expect(validation.issues).not.toContainEqual(
      expect.objectContaining({
        code: "OPTIONS_REQUIRED",
        partNumber: 4,
      }),
    );
    expect(firstMapQuestion.answers).toEqual(
      "ABCDEFGH".split("").map((variant) =>
        expect.objectContaining({
          variantText: variant,
          answer: variant,
          correct: variant === "C",
        }),
      ),
    );
  });

  it("keeps the official option skeleton when an older question has missing choices", () => {
    const draft = hydrateOfficialListeningDraft({
      id: "10000000-0000-4000-8000-000000000009",
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Eski dinleme testi",
      parts: [
        {
          number: 1,
          sections: [
            {
              transcript: "Kısa bir konuşma.",
              questions: [
                {
                  id: "question-1",
                  number: 1,
                  type: "MULTIPLE_CHOICE",
                  text: "İlk soru",
                  answers: [
                    {
                      id: "answer-a",
                      variantText: "A",
                      answer: "Birinci seçenek",
                      correct: true,
                    },
                    {
                      id: "answer-b",
                      variantText: "B",
                      answer: "İkinci seçenek",
                      correct: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const question = draft.parts[0].questions[0];
    expect(question.options).toEqual([
      {
        apiId: "answer-a",
        variant: "A",
        text: "Birinci seçenek",
      },
      {
        apiId: "answer-b",
        variant: "B",
        text: "İkinci seçenek",
      },
      {
        variant: "C",
        text: "",
      },
    ]);
    expect(question.correctVariant).toBe("A");
  });

  it("keeps locked Doğru and Yanlış labels while restoring saved answer ids", () => {
    const draft = hydrateOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Eski doğru yanlış testi",
      parts: [
        {},
        {
          number: 2,
          sections: [
            {
              transcript: "Doğru yanlış metni.",
              questions: [
                {
                  number: 9,
                  type: "TRUE_FALSE",
                  text: "Bir ifade",
                  answers: [
                    {
                      id: "answer-a",
                      answer: "True",
                      correct: true,
                    },
                    {
                      id: "answer-b",
                      answer: "False",
                      correct: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const question = draft.parts[1].questions[0];
    expect(
      question.options.map(({ variant, text }) => ({ variant, text })),
    ).toEqual([
      { variant: "A", text: "Doğru" },
      { variant: "B", text: "Yanlış" },
    ]);
    expect(question.answerIdsByVariant).toEqual({
      A: "answer-a",
      B: "answer-b",
    });
    expect(question.correctVariant).toBe("A");
  });

  it("stores one master audio while keeping part audio compatibility", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    draft.audioUrl = "https://cdn.example.com/listening.mp3";
    draft.audioDurationSeconds = 1875.2;

    const payload = serializeOfficialListeningDraft(draft);

    expect(payload.audioUrl).toBe(draft.audioUrl);
    expect(payload.audioDurationSeconds).toBe(1876);
    expect(
      payload.parts.every((part) => part.audioUrl === draft.audioUrl),
    ).toBe(true);
  });

  it("reports authored content but leaves audio timing to publication", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Eksik dinleme testi",
    });
    const validation = validateOfficialListeningDraft(draft);

    expect(validation.ready).toBe(false);
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        partNumber: 1,
        questionNumber: null,
        field: "transcript",
      }),
    );
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        partNumber: 1,
        questionNumber: 1,
        field: "correctAnswer",
      }),
    );
    expect(validation.issues).not.toContainEqual(
      expect.objectContaining({
        partNumber: 1,
        questionNumber: 1,
        field: "audioRange",
      }),
    );
    expect(validation.issues).not.toContainEqual(
      expect.objectContaining({
        partNumber: 1,
        questionNumber: 1,
        field: "prompt",
      }),
    );
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        partNumber: 2,
        questionNumber: 9,
        field: "prompt",
      }),
    );
  });

  it("round-trips transcript evidence and audio timestamps", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    draft.audioUrl = "https://cdn.example.com/listening.mp3";
    draft.audioDurationSeconds = 1800;
    const part = draft.parts[0];
    part.transcript = "Konuşmacı bugün kütüphaneye gideceğini söyledi.";
    part.transcriptFormatted =
      "**Konuşmacı** bugün *kütüphaneye* gideceğini söyledi.";
    const question = part.questions[0];
    question.prompt = "Konuşmacı nereye gidecek?";
    question.options.forEach((option) => {
      option.text = `${option.variant} seçeneği`;
    });
    question.correctVariant = "A";
    const evidenceText = "kütüphaneye gideceğini";
    const textStart = part.transcript.indexOf(evidenceText);
    question.evidence = {
      evidenceText,
      textStart,
      textEnd: textStart + evidenceText.length,
      evidenceSpans: [
        {
          evidenceText,
          textStart,
          textEnd: textStart + evidenceText.length,
        },
      ],
      explanation: "Konuşmacı gideceği yeri açıkça söylüyor.",
      audioStartMs: 12400,
      audioEndMs: 15800,
    };

    const payload = serializeOfficialListeningDraft(draft);
    const serializedQuestion = payload.parts[0].sections[0].questions[0];
    const reopened = hydrateOfficialListeningDraft({
      id: "10000000-0000-4000-8000-000000000002",
      ieltsId: draft.ieltsId,
      title: draft.title,
      audioUrl: draft.audioUrl,
      audioDurationSeconds: draft.audioDurationSeconds,
      parts: payload.parts,
    });

    expect(serializedQuestion.evidence).toEqual(question.evidence);
    expect(reopened.parts[0].transcript).toBe(part.transcript);
    expect(reopened.parts[0].transcriptFormatted).toBe(
      part.transcriptFormatted,
    );
    expect(reopened.parts[0].questions[0].evidence).toEqual(question.evidence);
  });

  it("accepts a fully populated draft and serializes exactly 35 questions", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Tam dinleme testi",
    });
    draft.audioUrl = "https://cdn.example.com/listening.mp3";
    draft.audioDurationSeconds = 2100;

    for (const part of draft.parts) {
      part.transcript = `Bölüm ${part.number} transcriptinde kanıt kelimesi bulunur.`;
      if (part.number === 4) {
        part.imageUrl = "https://cdn.example.com/map.png";
      }
      part.optionBank.forEach((option) => {
        option.text = `${option.variant} seçeneği`;
      });

      for (const [questionIndex, question] of part.questions.entries()) {
        question.prompt = `Soru ${question.number}`;
        question.options.forEach((option) => {
          option.text = `${option.variant} seçeneği`;
        });
        question.correctVariant =
          part.optionBank[questionIndex]?.variant ??
          question.options[0].variant;
        const evidenceText = "kanıt";
        const textStart = part.transcript.indexOf(evidenceText);
        question.evidence = {
          evidenceText,
          textStart,
          textEnd: textStart + evidenceText.length,
          explanation: "Bu bölüm doğru cevabı açıkça destekliyor.",
          audioStartMs: question.number * 1000,
          audioEndMs: question.number * 1000 + 800,
        };
      }
    }

    const validation = validateOfficialListeningDraft(draft);
    const payload = serializeOfficialListeningDraft(draft);
    expect(payload.parts[0].sections[0].questions[0].text).toBe("");
    expect(payload.parts[2].sections[0].questions[0].text).toBe(
      "1. konuşmacı ...",
    );

    expect(validation.ready).toBe(true);
    expect(validation.completedQuestions).toBe(35);
    expect(payload.parts).toHaveLength(6);
    expect(
      payload.parts.flatMap((part) =>
        part.sections.flatMap((section) => section.questions),
      ),
    ).toHaveLength(35);
  });
});
