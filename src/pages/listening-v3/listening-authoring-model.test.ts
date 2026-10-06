import { describe, expect, it } from "vitest";
import { hydrateOfficialListeningDraft, invalidateListeningEvidenceTiming, serializeOfficialListeningDraft, validateOfficialListeningDraft, withListeningEvidenceSpans } from "./listening-editor-model";
import { completeListeningDraft } from "./test/listening-draft-fixture";

const first = (draft: ReturnType<typeof completeListeningDraft>) => draft.parts[0].questions[0];
describe("listening evidence persistence", () => {
  it("accepts part-five explanations without a quote and preserves their dialogue timing on save", () => {
    const before = completeListeningDraft();
    const draft = structuredClone(before);
    const question = draft.parts[4].questions[0];
    question.evidence = withListeningEvidenceSpans([], question.evidence);
    const updated = invalidateListeningEvidenceTiming(before, draft);
    const payload = serializeOfficialListeningDraft(updated);
    const reopened = hydrateOfficialListeningDraft(payload);
    expect(reopened.parts[4].questions[0].evidence).toEqual(question.evidence);
    expect(validateOfficialListeningDraft(reopened).ready).toBe(true);
    reopened.parts[4].questions[0].evidence!.explanation = "";
    expect(validateOfficialListeningDraft(reopened).issues).toContainEqual(expect.objectContaining({ code: "EXPLANATION_REQUIRED", questionNumber: 24 }));
  });
  it("keeps the explanation and audio range when the optional part-one quote is removed", () => {
    const draft = completeListeningDraft();
    first(draft).evidence = withListeningEvidenceSpans([], first(draft).evidence);
    const payload = JSON.parse(JSON.stringify(serializeOfficialListeningDraft(draft)));
    expect(payload.parts[0].sections[0].questions[0].evidence).toMatchObject({
      evidenceText: "", textStart: 0, textEnd: 0, evidenceSpans: [],
      explanation: "Cevabı destekleyen söz.", audioStartMs: 1000, audioEndMs: 3000,
    });
    const reopened = hydrateOfficialListeningDraft(payload);
    expect(first(reopened).evidence).toEqual(first(draft).evidence);
    expect(validateOfficialListeningDraft(reopened).ready).toBe(true);
  });

  it("still requires an explanation in part one and quotations in the other parts", () => {
    const draft = completeListeningDraft();
    first(draft).evidence = withListeningEvidenceSpans([], { explanation: "", audioStartMs: 1000, audioEndMs: 3000 });
    draft.parts[1].questions[0].evidence = withListeningEvidenceSpans([], draft.parts[1].questions[0].evidence);
    const issues = validateOfficialListeningDraft(draft).issues;
    expect(issues).toContainEqual(expect.objectContaining({ code: "EXPLANATION_REQUIRED", questionNumber: 1 }));
    expect(issues).not.toContainEqual(expect.objectContaining({ code: "EVIDENCE_REQUIRED", questionNumber: 1 }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "EVIDENCE_REQUIRED", questionNumber: 9 }));
  });

  it("keeps existing timing when part-one quotes are removed, but clears it when the transcript changes", () => {
    const before = completeListeningDraft();
    const edited = structuredClone(before);
    first(edited).evidence = withListeningEvidenceSpans([], first(edited).evidence);
    expect(first(invalidateListeningEvidenceTiming(before, edited)).evidence?.audioStartMs).toBe(1000);
    edited.parts[0].transcript = "Yeni kayıt metni.";
    expect(first(invalidateListeningEvidenceTiming(before, edited)).evidence?.audioEndMs).toBe(0);
  });

  it("retains the chosen occurrence and its stored end for a repeated quotation", () => {
    const source = serializeOfficialListeningDraft(completeListeningDraft());
    const section = source.parts[0].sections[0];
    section.transcript = "Aynı söz. Ara cümle. Aynı söz.";
    section.questions[0].evidence = { evidenceText: "Aynı söz.", textStart: 21, textEnd: 30, explanation: "İkinci tekrar.", audioStartMs: 45000, audioEndMs: 48000, evidenceSpans: [] };
    expect(first(hydrateOfficialListeningDraft(source)).evidence).toMatchObject({ textStart: 21, textEnd: 30, audioStartMs: 45000 });
    section.questions[0].evidence.textStart = 20;
    expect(first(hydrateOfficialListeningDraft(source)).evidence?.textStart).toBe(20);
    expect(validateOfficialListeningDraft(hydrateOfficialListeningDraft(source)).issues).toContainEqual(expect.objectContaining({ code: "EVIDENCE_SOURCE_MISMATCH", questionNumber: 1 }));
  });

  it("does not replace an invalid old quote with changed transcript text on save and reopen", () => {
    const before = completeListeningDraft();
    const edited = structuredClone(before);
    edited.parts[0].transcript = "Yanlışa cümle. İkinci cümle.";
    const draft = invalidateListeningEvidenceTiming(before, edited);
    const payload = serializeOfficialListeningDraft(draft);
    expect(payload.parts[0].sections[0].questions[0].evidence).toMatchObject({ evidenceText: "Birinci", audioStartMs: 0, audioEndMs: 0 });
    expect(validateOfficialListeningDraft(hydrateOfficialListeningDraft(payload)).issues).toContainEqual(expect.objectContaining({ code: "EVIDENCE_SOURCE_MISMATCH", questionNumber: 1 }));
    expect(draft.parts[1].questions[0].evidence?.audioStartMs).toBe(1000);
  });

  it("invalidates every old timing after changing the recording", () => {
    const before = completeListeningDraft();
    const draft = invalidateListeningEvidenceTiming(before, { ...before, audioUrl: "uploads/new.mp3" });
    expect(draft.parts.flatMap((part) => part.questions).every((question) => question.evidence?.audioStartMs === 0 && question.evidence.audioEndMs === 0)).toBe(true);
  });

  it("invalidates changed selections while allowing explicit timing and explanation corrections", () => {
    const before = completeListeningDraft();
    const next = structuredClone(before);
    first(next).evidence = { ...first(next).evidence!, evidenceText: "İkinci", textStart: 15, textEnd: 21 };
    expect(first(invalidateListeningEvidenceTiming(before, next)).evidence?.audioStartMs).toBe(0);
    const corrected = structuredClone(before);
    first(corrected).evidence = { ...first(corrected).evidence!, audioStartMs: 1200, explanation: "Düzeltilmiş açıklama." };
    expect(first(invalidateListeningEvidenceTiming(before, corrected)).evidence?.audioStartMs).toBe(1200);
  });

  it("hydrates revision and group metadata from the full-tree response", () => {
    const payload = serializeOfficialListeningDraft(completeListeningDraft());
    const draft = hydrateOfficialListeningDraft({ ...payload, ieltsId: undefined, id: "test-2", ielts: { id: "group-1" }, status: "PUBLISHED", publishedAt: "2026-09-12", contentRevision: 7 });
    expect(draft).toMatchObject({ testId: "test-2", ieltsId: "group-1", status: "PUBLISHED", contentRevision: 7, publishedAt: "2026-09-12" });
  });
});
