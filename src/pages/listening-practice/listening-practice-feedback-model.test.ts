import { describe, expect, it } from "vitest";
import {
  changePracticeAudio,
  changePracticeTranscript,
  practiceFeedbackIssues,
  selectPracticeEvidence,
} from "./listening-practice-feedback-model";
const transcript = "Girişin sağında müze var. Solda bilet gişesi var.";
const evidence = {
  ...selectPracticeEvidence(transcript, 0, 24),
  audioStartMs: 1000,
  audioEndMs: 5000,
  explanation: "Sağdaki yapı D, yani müzedir.",
};
const section = {
  transcript,
  content: transcript,
  transcriptAlignment: { version: 1 },
  questions: [
    {
      id: "stable-id",
      number: 19,
      answers: [{ correct: true, variantText: "D" }],
      evidence,
    },
  ],
};
describe("listening practice evidence authoring", () => {
  it("uses exact offsets and invalidates the clip when a new quote is selected", () => {
    const selected = selectPracticeEvidence(
      transcript,
      25,
      transcript.length,
      evidence,
    );
    expect(selected.evidenceText).toBe("Solda bilet gişesi var.");
    expect(transcript.slice(selected.textStart!, selected.textEnd!)).toBe(
      selected.evidenceText,
    );
    expect(selected.audioStartMs).toBeNull();
    expect(selected.explanation).toBe(evidence.explanation);
  });
  it("invalidates evidence after transcript edits, preserving IDs and keys", () => {
    const next = changePracticeTranscript(section, "Yeni metin.");
    expect(next.content).toBe("Yeni metin.");
    expect(next.transcriptAlignment).toBeNull();
    expect(next.questions[0].evidence).toEqual({
      explanation: evidence.explanation,
    });
    expect(next.questions[0].id).toBe("stable-id");
    expect(next.questions[0].answers).toEqual(section.questions[0].answers);
    expect(section.questions[0].evidence.audioStartMs).toBe(1000);
    expect(changePracticeTranscript(section, transcript)).toBe(section);
  });
  it("a new recording invalidates timing but keeps the text", () => {
    const content = {
      audioUrl: "/old.mp3",
      audioDurationSeconds: 30,
      parts: [{ sections: [section] }],
    };
    const next = changePracticeAudio(content, "/new.mp3");
    expect(next.audioDurationSeconds).toBeNull();
    expect(
      next.parts[0].sections[0].questions[0].evidence!.audioStartMs,
    ).toBeNull();
    expect(next.parts[0].sections[0].questions[0].evidence!.evidenceText).toBe(
      evidence.evidenceText,
    );
    expect(
      content.parts[0].sections[0].questions[0].evidence.audioStartMs,
    ).toBe(1000);
  });
  it("reports missing evidence and ranges beyond the recording", () => {
    expect(practiceFeedbackIssues(section, section.questions[0], 30)).toEqual(
      [],
    );
    expect(practiceFeedbackIssues(section, section.questions[0], 2)).toContain(
      "Ses aralığını belirleyin",
    );
    expect(
      practiceFeedbackIssues({ transcript: "" }, { answers: [], evidence: {} }),
    ).toHaveLength(5);
    expect(
      practiceFeedbackIssues(section, {
        ...section.questions[0],
        evidence: { ...evidence, textEnd: 1 },
      }),
    ).toContain("Transkriptten cevap cümlesi seçin");
  });
});
