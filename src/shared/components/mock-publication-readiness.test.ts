import { describe, expect, it } from "vitest";
import {
  describePublicationIssue,
  getReadyQuestionCount,
} from "./mock-publication-readiness";

describe("mock publication readiness", () => {
  it("counts each blocked question once when it has multiple issues", () => {
    expect(
      getReadyQuestionCount({
        ready: false,
        questionCount: 4,
        issues: [
          { code: "EVIDENCE_REQUIRED", questionNumber: 2 },
          { code: "EXPLANATION_REQUIRED", questionNumber: 2 },
          { code: "CORRECT_ANSWER_REQUIRED", questionNumber: 4 },
        ],
      }),
    ).toBe(2);
  });

  it("treats a test-level blocker as not ready", () => {
    expect(
      getReadyQuestionCount({
        ready: false,
        questionCount: 3,
        issues: [{ code: "AUDIO_REQUIRED", questionNumber: null }],
      }),
    ).toBe(0);
  });

  it("describes issues in admin-friendly language", () => {
    expect(
      describePublicationIssue({
        code: "SOURCE_RANGE_INVALID",
        questionNumber: 7,
      }),
    ).toBe("Soru 7: Kanıtı kaynak metinden yeniden seçin");
  });
});
