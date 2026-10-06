import { describe, expect, it } from "vitest";
import officialReadingInstructions from "@/data/official-reading-instructions.json";
import {
  createOfficialReadingDraft,
  hydrateOfficialReadingDraft,
  serializeOfficialReadingDraft,
  validateOfficialReadingDraft,
  withReadingEvidenceSpans,
} from "./reading-editor-model";

describe("official reading editor model", () => {
  it("creates the fixed five-part, 35-question national exam structure", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });

    expect(draft.parts.map((part) => part.questions.length)).toEqual([
      6, 8, 6, 9, 6,
    ]);
    expect(draft.parts.flatMap((part) => part.questions.map((question) => question.number))).toEqual(
      Array.from({ length: 35 }, (_, index) => index + 1),
    );
    expect(draft.parts[0].questions.every((question) => question.type === "FILL_BLANK")).toBe(
      true,
    );
    expect(draft.parts[3].questions.slice(4).every((question) => question.type === "TRUE_FALSE")).toBe(
      true,
    );
    expect(draft.parts[4].questions.slice(3).every((question) => question.type === "MATCHING")).toBe(
      true,
    );
    expect(draft.parts.map((part) => part.description)).toEqual(
      Object.values(officialReadingInstructions.parts),
    );
  });

  it("uses official instructions when saving and reopening custom source instructions", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });
    draft.parts[0].description =
      "Sorular 1-6 için özel olarak düzenlenmiş bölüm yönergesi.";

    const payload = serializeOfficialReadingDraft(draft);
    expect(payload.parts[0].description).toBe(officialReadingInstructions.parts["1"]);

    const reopened = hydrateOfficialReadingDraft({
      id: "10000000-0000-4000-8000-000000000002",
      ieltsId: draft.ieltsId,
      title: draft.title,
      parts: payload.parts.map((part) => ({ ...part, description: "Kaynak dosyanın özel yönergesi" })),
    });

    expect(reopened.parts.map((part) => part.description)).toEqual(Object.values(officialReadingInstructions.parts));
  });

  it("reports the exact part and question for missing publication fields", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });
    const validation = validateOfficialReadingDraft(draft);

    expect(validation.ready).toBe(false);
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        partNumber: 1,
        questionNumber: 1,
        field: "correctAnswer",
      }),
    );
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        partNumber: 2,
        questionNumber: 7,
        field: "sourceText",
      }),
    );
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        partNumber: 5,
        questionNumber: 33,
        field: "prompt",
      }),
    );
  });

  it("serializes part 2 as text-first cards and preserves evidence offsets", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });
    const part = draft.parts[1];
    part.optionBank[0].text = "Sessiz bir çalışma ortamı arayanlar";
    const question = part.questions[0];
    question.sourceTitle = "Şehir Kütüphanesi";
    question.sourceText =
      "Şehir Kütüphanesi hafta içi sessiz çalışma salonları sunar.";
    question.correctVariant = "A";
    const evidenceText = "sessiz çalışma salonları";
    const start = question.sourceText.indexOf(evidenceText);
    question.evidence = {
      evidenceText,
      explanation: "Kart, sessiz çalışma alanını açıkça sunuyor.",
      textStart: start,
      textEnd: start + evidenceText.length,
    };

    const payload = serializeOfficialReadingDraft(draft);
    const section = payload.parts[1].sections[0];
    const serializedQuestion = section.questions[0];

    expect(section.content).toBe(question.sourceText);
    expect(serializedQuestion.text).toBe(question.sourceTitle);
    expect(serializedQuestion.content).toBe(question.sourceText);
    expect(serializedQuestion.imageUrl).toBeUndefined();
    expect(serializedQuestion.evidence).toEqual({
      ...question.evidence,
      evidenceSpans: [
        {
          evidenceText,
          textStart: start,
          textEnd: start + evidenceText.length,
        },
      ],
    });
    expect(serializedQuestion.answers.find((answer) => answer.variantText === "A")?.correct).toBe(
      true,
    );
  });

  it("invalidates evidence when the selected text no longer matches the source", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });
    const question = draft.parts[3].questions[0];
    draft.parts[3].sourceText = "Metindeki ilk bilgi burada yer alır.";
    question.correctVariant = "A";
    question.options[0].text = "İlk bilgi";
    question.evidence = {
      evidenceText: "ilk bilgi",
      explanation: "Metin bunu açıkça söylüyor.",
      textStart: 10,
      textEnd: 20,
    };

    const validation = validateOfficialReadingDraft(draft);

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        questionNumber: 21,
        field: "evidence",
        code: "EVIDENCE_SOURCE_MISMATCH",
      }),
    );
  });

  it("serializes and reopens multiple evidence fragments for one question", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });
    const source = "İlk kanıt burada. İkinci destek cümlesi burada.";
    const firstText = "İlk kanıt";
    const secondText = "İkinci destek cümlesi";
    const firstStart = source.indexOf(firstText);
    const secondStart = source.indexOf(secondText);
    draft.parts[0].sourceText = source;
    draft.parts[0].questions[0].evidence = {
      evidenceText: firstText,
      explanation: "İki ayrı bölüm aynı doğru cevabı destekliyor.",
      textStart: firstStart,
      textEnd: firstStart + firstText.length,
      evidenceSpans: [
        {
          evidenceText: firstText,
          textStart: firstStart,
          textEnd: firstStart + firstText.length,
        },
        {
          evidenceText: secondText,
          textStart: secondStart,
          textEnd: secondStart + secondText.length,
        },
      ],
    };

    const payload = serializeOfficialReadingDraft(draft);
    const serializedEvidence =
      payload.parts[0].sections[0].questions[0].evidence;
    expect(serializedEvidence?.evidenceSpans).toHaveLength(2);

    const reopened = hydrateOfficialReadingDraft({
      id: "10000000-0000-4000-8000-000000000002",
      ieltsId: draft.ieltsId,
      title: draft.title,
      parts: payload.parts,
    });
    expect(
      reopened.parts[0].questions[0].evidence?.evidenceSpans,
    ).toEqual(serializedEvidence?.evidenceSpans);
  });

  it("preserves each part 2 card section id when an existing draft is reopened", () => {
    const source = "Kart metni kanıt içerir.";
    const sections = Array.from({ length: 8 }, (_, index) => {
      const number = index + 7;
      return {
        id: `20000000-0000-4000-8000-0000000000${number}`,
        title: `Kart ${number}`,
        content: source,
        questions: [
          {
            id: `30000000-0000-4000-8000-0000000000${number}`,
            number,
            type: "MATCHING" as const,
            text: `Kart ${number}`,
            content: source,
            answers: Array.from({ length: 10 }, (_, optionIndex) => ({
              id: `40000000-0000-4000-8000-000000000${number}${optionIndex}`,
              variantText: String.fromCharCode(65 + optionIndex),
              answer: `Seçenek ${optionIndex + 1}`,
              correct: optionIndex === 0,
            })),
            evidence: {
              evidenceText: "kanıt içerir",
              explanation: "Kart bunu açıkça söylüyor.",
              textStart: source.indexOf("kanıt içerir"),
              textEnd: source.indexOf("kanıt içerir") + "kanıt içerir".length,
            },
          },
        ],
      };
    });
    const draft = hydrateOfficialReadingDraft({
      id: "10000000-0000-4000-8000-000000000001",
      ieltsId: "10000000-0000-4000-8000-000000000002",
      title: "Mevcut test",
      parts: [{ id: "part-2", number: 2, title: "Bölüm 2", sections }],
    });

    const payload = serializeOfficialReadingDraft(draft);

    expect(payload.parts[1].sections.map((section) => section.id)).toEqual(
      sections.map((section) => section.id),
    );
  });

  it("accepts a complete five-part draft and serializes exactly 35 questions", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Tam okuma testi",
    });

    for (const part of draft.parts) {
      if ([1, 4, 5].includes(part.number)) {
        part.sourceTitle = `Bölüm ${part.number} metni`;
        part.sourceText =
          part.number === 1
            ? "Kanıt ___ (S1) ___ (S2) ___ (S3) ___ (S4) ___ (S5) ___ (S6)"
            : `Bölüm ${part.number} için kanıt cümlesi burada yer alır.`;
      }
      part.optionBank.forEach((option) => {
        option.text = `${option.variant} seçeneği`;
      });

      for (const question of part.questions) {
        if (part.number === 2) {
          question.sourceTitle = `Kart ${question.number}`;
          question.sourceText = `Kart ${question.number} için kanıt cümlesi.`;
        }
        if (part.number === 3) {
          question.sourceText = `Paragraf ${question.number} için kanıt cümlesi.`;
        }
        if (part.number === 4 || part.number === 5) {
          question.prompt = `Soru ${question.number}`;
        }
        question.options.forEach((option) => {
          option.text = `${option.variant} seçeneği`;
        });
        question.correctVariant = (
          part.optionBank[part.questions.indexOf(question)] ?? question.options[0]
        ).variant;

        const source =
          part.number === 2 || part.number === 3
            ? question.sourceText
            : part.sourceText;
        const evidenceText = source.includes("kanıt") ? "kanıt" : "Kanıt";
        const textStart = source.indexOf(evidenceText);
        question.evidence = {
          evidenceText,
          explanation: "Seçilen cümle doğru cevabı açıkça destekliyor.",
          textStart,
          textEnd: textStart + evidenceText.length,
        };
      }
    }

    const validation = validateOfficialReadingDraft(draft);
    const payload = serializeOfficialReadingDraft(draft);

    expect(validation.ready).toBe(true);
    expect(validation.completedQuestions).toBe(35);
    expect(payload.parts).toHaveLength(5);
    expect(
      payload.parts.flatMap((part) =>
        part.sections.flatMap((section) => section.questions),
      ),
    ).toHaveLength(35);
  });

  it.each([1, 2, 3])("rejects reused correct variants in shared-option part %s", (partNumber) => {
    const draft = createOfficialReadingDraft({ ieltsId: "group", title: "Deneme" });
    const part = draft.parts[partNumber - 1];
    part.questions[0].correctVariant = "A";
    part.questions[1].correctVariant = "A";
    const duplicates = validateOfficialReadingDraft(draft).issues.filter((item) => item.code === "CORRECT_ANSWER_REUSED");
    expect(duplicates.map((item) => item.questionNumber)).toEqual(part.questions.slice(0, 2).map((question) => question.number));
    part.questions[1].correctVariant = "B";
    expect(validateOfficialReadingDraft(draft).issues.some((item) => item.code === "CORRECT_ANSWER_REUSED")).toBe(false);
  });

  it("serializes the shared bank consistently for every question while keeping individual keys", () => {
    const draft = createOfficialReadingDraft({ ieltsId: "group", title: "Deneme" });
    const part = draft.parts[1];
    part.optionBank[0].text = "Yeni ortak seçenek";
    part.questions[0].correctVariant = "A";
    part.questions[1].correctVariant = "B";
    part.questions[1].options[0].text = "Eski soru seçeneği";
    const questions = serializeOfficialReadingDraft(draft).parts[1].sections.flatMap((section) => section.questions);
    expect(questions.every((question) => question.answers[0].answer === "Yeni ortak seçenek")).toBe(true);
    expect(questions[0].answers.find((answer) => answer.correct)?.variantText).toBe("A");
    expect(questions[1].answers.find((answer) => answer.correct)?.variantText).toBe("B");
  });

  it("keeps an explanation without a quote for part 1 through save and reopen", () => {
    const draft = createOfficialReadingDraft({ ieltsId: "group", title: "Deneme" });
    draft.parts[0].questions[0].evidence = withReadingEvidenceSpans([], "Silinen açıklama");
    const payload = JSON.parse(JSON.stringify(serializeOfficialReadingDraft(draft)));
    const evidence = payload.parts[0].sections[0].questions[0].evidence;
    expect(evidence?.explanation).toBe("Silinen açıklama");
    expect(evidence?.evidenceSpans).toEqual([]);
    const reopened = hydrateOfficialReadingDraft({ ...payload, id: "test" });
    expect(reopened.parts[0].questions[0].evidence?.explanation).toBe("Silinen açıklama");
    expect(validateOfficialReadingDraft(draft).issues.filter(issue => issue.questionNumber === 1 && issue.field === "evidence")).toEqual([]);
    expect(withReadingEvidenceSpans([], "")).toBeUndefined();
  });

  it("preserves two distinct occurrences of the same quotation through save and reopen", () => {
    const draft = createOfficialReadingDraft({ ieltsId: "group", title: "Deneme" });
    draft.parts[0].sourceText = "Ali burada. Ali burada.";
    draft.parts[0].questions[0].evidence = withReadingEvidenceSpans([
      { evidenceText: "Ali", textStart: 0, textEnd: 3 },
      { evidenceText: "Ali", textStart: 12, textEnd: 15 },
    ], "İki ayrı ifade");
    const payload = serializeOfficialReadingDraft(draft);
    const reopened = hydrateOfficialReadingDraft(payload);
    expect(reopened.parts[0].questions[0].evidence?.evidenceSpans).toEqual(draft.parts[0].questions[0].evidence?.evidenceSpans);
  });

  it("translates part 3 global offsets without moving repeated quotations to the first occurrence", () => {
    const draft = createOfficialReadingDraft({ ieltsId: "group", title: "Deneme" });
    for (const question of draft.parts[2].questions) {
      question.sourceText = "Ali burada. Ali burada.";
      question.evidence = withReadingEvidenceSpans([{ evidenceText: "Ali", textStart: 12, textEnd: 15 }], "İkinci ifade");
    }
    const reopened = hydrateOfficialReadingDraft(serializeOfficialReadingDraft(draft));
    expect(reopened.parts[2].questions.map((question) => question.evidence?.textStart)).toEqual([12, 12, 12, 12, 12, 12]);
  });

  it("keeps a stale quotation invalid instead of rewriting it to the changed source", () => {
    const draft = createOfficialReadingDraft({ ieltsId: "group", title: "Deneme" });
    draft.parts[0].sourceText = "Veli burada.";
    draft.parts[0].questions[0].evidence = withReadingEvidenceSpans([{ evidenceText: "Ali", textStart: 0, textEnd: 3 }], "Eski kanıt");
    const payload = serializeOfficialReadingDraft(draft);
    expect(payload.parts[0].sections[0].questions[0].evidence?.evidenceText).toBe("Ali");
    const reopened = hydrateOfficialReadingDraft(payload);
    expect(validateOfficialReadingDraft(reopened).issues).toContainEqual(expect.objectContaining({ code: "EVIDENCE_SOURCE_MISMATCH", questionNumber: 1 }));
  });
});
