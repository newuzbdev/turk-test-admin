import { describe, expect, it } from "vitest";

describe("mock answer-key validation", () => {
  it("finds questions without a selected correct answer in the shared editor", async () => {
    const { findSharedEditorMissingAnswerKeys } = await import(
      "./mock-answer-key-validation"
    );

    expect(
      findSharedEditorMissingAnswerKeys([
        {
          title: "Bölüm 1",
          sections: [
            {
              title: "Sorular",
              type: "MULTIPLE_CHOICE",
              questions: [
                {
                  number: 1,
                  text: "Soru",
                  answers: [
                    { text: "A", isCorrect: false },
                    { text: "B", isCorrect: false },
                  ],
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual([1]);
  });

  it("accepts a matching question with a valid shared correct variant", async () => {
    const { findSharedEditorMissingAnswerKeys } = await import(
      "./mock-answer-key-validation"
    );

    expect(
      findSharedEditorMissingAnswerKeys([
        {
          title: "Bölüm 1",
          sections: [
            {
              title: "Eşleştirme",
              type: "MATCHING",
              sharedVariants: [
                { text: "A seçeneği", isCorrect: false },
                { text: "B seçeneği", isCorrect: false },
              ],
              questions: [
                {
                  number: 4,
                  text: "Soru",
                  answers: [],
                  correctVariantIndex: 1,
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual([]);
  });

  it("does not treat an empty matching selection as the first correct variant", async () => {
    const { findSharedEditorMissingAnswerKeys } = await import(
      "./mock-answer-key-validation"
    );

    expect(
      findSharedEditorMissingAnswerKeys([
        {
          sections: [
            {
              type: "MATCHING",
              sharedVariants: [{ text: "A seçeneği", isCorrect: false }],
              questions: [
                {
                  number: 6,
                  answers: [],
                  correctVariantIndex: null,
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual([6]);
  });

  it("finds Reading questions whose selected letter is empty or missing", async () => {
    const { findReadingEditorMissingAnswerKeys } = await import(
      "./mock-answer-key-validation"
    );

    expect(
      findReadingEditorMissingAnswerKeys([
        {
          title: "Part 1",
          sections: [
            {
              title: "Sorular",
              questions: [
                {
                  blankNumber: 3,
                  correctAnswer: "B",
                  options: [
                    { letter: "A", text: "Birinci" },
                    { letter: "B", text: "" },
                  ],
                },
                {
                  blankNumber: 4,
                  correctAnswer: "",
                  options: [{ letter: "A", text: "Birinci" }],
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual([3, 4]);
  });

  it("does not invent a Reading answer when stored data has no correct flag", async () => {
    const { getStoredCorrectVariant } = await import(
      "./mock-answer-key-validation"
    );

    expect(
      getStoredCorrectVariant([
        { variantText: "A", correct: false },
        { variantText: "B", correct: false },
      ]),
    ).toBe("");
    expect(
      getStoredCorrectVariant([
        { variantText: "A", correct: false },
        { variantText: "B", correct: true },
      ]),
    ).toBe("B");
  });
});
