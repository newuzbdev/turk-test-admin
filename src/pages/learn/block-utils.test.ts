import { describe, expect, it } from "vitest";
import {
  buildLearnBlockPayload,
  getLearnBlockTypeLabel,
} from "./block-utils";

describe("Learn Block Editor frontend helpers", () => {
  it("builds text blocks without unrelated or sensitive fields", () => {
    expect(
      buildLearnBlockPayload({
        type: "EXAMPLE",
        title: "Kaydedilmemeli",
        text: "  Ben öğrenciyim.  ",
        mediaUrl: "https://unused.example",
        exerciseId: "unused",
      })
    ).toEqual({
      type: "EXAMPLE",
      text: "Ben öğrenciyim.",
    });
  });

  it("only writes optional exerciseId into interactive block data", () => {
    expect(
      buildLearnBlockPayload({
        type: "MINI_QUESTION",
        exerciseId: "  exercise-id  ",
      })
    ).toEqual({
      type: "MINI_QUESTION",
      data: { exerciseId: "exercise-id" },
    });

    expect(
      JSON.stringify(
        buildLearnBlockPayload({
          type: "FINAL_EXERCISE",
        })
      ).toLowerCase()
    ).not.toContain("answer");
  });

  it("provides a Turkish label for every editor block type", () => {
    expect(getLearnBlockTypeLabel("FINAL_EXERCISE")).toBe("Final alıştırması");
    expect(getLearnBlockTypeLabel("GRAMMAR_PATTERN")).toBe("Gramer Kalıbı");
    expect(getLearnBlockTypeLabel("COMMON_MISTAKE")).toBe("Sık Hata");
    expect(getLearnBlockTypeLabel("EXAM_TIP")).toBe("Sınav İpucu");
    expect(getLearnBlockTypeLabel("VOCABULARY_LIST")).toBe("Kelime Listesi");
  });

  it("builds grammar pattern block data from controlled fields", () => {
    expect(
      buildLearnBlockPayload({
        type: "GRAMMAR_PATTERN",
        grammarPattern: {
          pattern: "  Ben + isim + -im  ",
          explanation: "  Kendini tanıtırken kullanılır.  ",
          rows: [
            {
              label: "  Ben  ",
              form: "  -im  ",
              example: "  Ben öğrenciyim.  ",
              note: "  kısa not  ",
            },
            { label: "   ", form: "   " },
          ],
          examples: [
            { text: "  Ben öğretmenim.  ", explanation: "  Meslek  " },
            { text: "   ", explanation: "Kaydedilmemeli" },
          ],
        },
      })
    ).toEqual({
      type: "GRAMMAR_PATTERN",
      data: {
        pattern: "Ben + isim + -im",
        explanation: "Kendini tanıtırken kullanılır.",
        rows: [
          {
            label: "Ben",
            form: "-im",
            example: "Ben öğrenciyim.",
            note: "kısa not",
          },
        ],
        examples: [
          {
            text: "Ben öğretmenim.",
            explanation: "Meslek",
          },
        ],
      },
    });
  });

  it("builds common mistake and exam tip data without unrelated fields", () => {
    expect(
      buildLearnBlockPayload({
        type: "COMMON_MISTAKE",
        commonMistake: {
          wrong: "  Ben öğrenci  ",
          correct: "  Ben öğrenciyim.  ",
          explanation: "  Ek eksik.  ",
        },
      })
    ).toEqual({
      type: "COMMON_MISTAKE",
      data: {
        wrong: "Ben öğrenci",
        correct: "Ben öğrenciyim.",
        explanation: "Ek eksik.",
      },
    });

    expect(
      buildLearnBlockPayload({
        type: "EXAM_TIP",
        examTip: {
          tip: "  Cevabı kısa ve net yaz.  ",
          skillTagKey: "  writing.resmi-eposta  ",
          level: "B1",
        },
      })
    ).toEqual({
      type: "EXAM_TIP",
      data: {
        tip: "Cevabı kısa ve net yaz.",
        skillTagKey: "writing.resmi-eposta",
        level: "B1",
      },
    });
  });

  it("builds vocabulary list data and keeps sensitive keys out", () => {
    const payload = buildLearnBlockPayload({
      type: "VOCABULARY_LIST",
      vocabularyList: {
        items: [
          {
            word: "  öğrenci  ",
            meaning: "  student  ",
            example: "  Ben öğrenciyim.  ",
            note: "  A1  ",
          },
          { word: "boş", meaning: "   " },
        ],
      },
      answerKey: { value: true },
      acceptedAnswers: ["hidden"],
      correctAnswer: "hidden",
      solution: "hidden",
    } as never);

    expect(payload).toEqual({
      type: "VOCABULARY_LIST",
      data: {
        items: [
          {
            word: "öğrenci",
            meaning: "student",
            example: "Ben öğrenciyim.",
            note: "A1",
          },
        ],
      },
    });
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("answer");
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("solution");
  });
});
