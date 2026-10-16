import { expect, it } from "vitest";
import {
  listeningGlossaryCoverage,
  listeningGlossaryRequest,
  mergeListeningGlossary,
} from "./listening-practice-glossary-model";
import type { PracticeSection } from "./listening-practice-feedback-model";
it("counts common words and repeated uses separately, including apostrophes", () => {
  const section: PracticeSection = {
    transcript: "Bu ve bu, Kapısı'nın önünde.",
    questions: [],
    glossaryEntries: [
      {
        term: "Bu",
        baseMeaning: "Yakındaki bir şeyi gösterir.",
        occurrenceIndex: 1,
      },
    ],
  };
  expect(listeningGlossaryCoverage(section)).toMatchObject({
    total: 5,
    covered: 1,
    missing: [
      { term: "ve", occurrenceIndex: 1 },
      { term: "bu", occurrenceIndex: 2 },
      { term: "Kapısı'nın", occurrenceIndex: 1 },
      { term: "önünde", occurrenceIndex: 1 },
    ],
  });
  const request = listeningGlossaryRequest(section, "s1");
  expect(request.paragraphs).toEqual([
    { label: "s1", text: section.transcript },
  ]);
  section.glossaryEntries?.push({ term: "bu", baseMeaning: "Genel anlam." });
  expect(listeningGlossaryRequest(section, "s1").existingEntries).toHaveLength(
    2,
  );
});
it("merges only missing on-text uses and preserves edits made during generation", () => {
  const section: PracticeSection = {
    transcript: "Bu ve bu.",
    questions: [],
    glossaryEntries: [
      { term: "Bu", baseMeaning: "Elle düzenlendi.", occurrenceIndex: 1 },
    ],
  };
  const entries = mergeListeningGlossary(
    section,
    [
      {
        order: 1,
        term: "Bu",
        occurrenceIndex: 1,
        paragraphLabel: "s1",
        definition: "Üzerine yazılmamalı.",
      },
      {
        order: 2,
        term: "bu",
        occurrenceIndex: 2,
        paragraphLabel: "s1",
        baseForm: "bu",
        definition: "Önce sözü edilen şeyi gösterir.",
      },
      {
        order: 3,
        term: "yok",
        occurrenceIndex: 1,
        paragraphLabel: "s1",
        definition: "Metinde yok.",
      },
      {
        order: 4,
        term: "ve",
        occurrenceIndex: 1,
        paragraphLabel: "other",
        definition: "Yanlış bölüm.",
      },
    ],
    "s1",
  );
  expect(entries).toHaveLength(2);
  expect(entries[0].baseMeaning).toBe("Elle düzenlendi.");
  expect(
    listeningGlossaryCoverage({ ...section, glossaryEntries: entries }).missing,
  ).toEqual([{ term: "ve", occurrenceIndex: 1 }]);
});
