import { describe, expect, it } from "vitest";
import {
  buildLearnQuestionPayload,
  questionToFormValues,
} from "./exercise-utils";

describe("Learn Exercise/Question editor helpers", () => {
  it("builds multiple choice options and zero-based answer key", () => {
    expect(
      buildLearnQuestionPayload({
        type: "MULTIPLE_CHOICE",
        prompt: " Doğru cevabı seçin. ",
        optionsText: "Bir\nİki\n",
        correctOption: 2,
        points: 2,
      })
    ).toEqual({
      type: "MULTIPLE_CHOICE",
      prompt: "Doğru cevabı seçin.",
      explanation: undefined,
      points: 2,
      options: ["Bir", "İki"],
      answerKey: { optionIndex: 1 },
    });
  });

  it("builds deduplicated multi-select and accepted-answer payloads", () => {
    expect(
      buildLearnQuestionPayload({
        type: "MULTI_SELECT",
        prompt: "Seçin",
        optionsText: "A\nB\nC",
        correctOptionsText: "1, 3, 3",
      }).answerKey
    ).toEqual({ optionIndexes: [0, 2] });

    expect(
      buildLearnQuestionPayload({
        type: "FILL_BLANK",
        prompt: "Tamamlayın",
        acceptedAnswersText: "öğretmen\nhoca",
      })
    ).toMatchObject({
      options: null,
      answerKey: { acceptedAnswers: ["öğretmen", "hoca"] },
    });
  });

  it("maps stored answer keys back into editable admin fields", () => {
    expect(
      questionToFormValues({
        id: "q1",
        exerciseId: "e1",
        type: "TRUE_FALSE",
        prompt: "Doğru mu?",
        explanation: null,
        options: null,
        answerKey: { value: true },
        sortOrder: 0,
        points: 1,
        createdAt: "",
        updatedAt: "",
        _count: { answers: 0 },
      }).trueFalseValue
    ).toBe("true");
  });
});
