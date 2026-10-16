import type {
  ReadingPracticeGlossaryGenerationRequest,
  ReadingPracticeGlossaryEntry,
} from "@/utils/types/types";
import type {
  PracticeGlossaryEntry,
  PracticeSection,
} from "./listening-practice-feedback-model";

const wordPattern = /\p{L}+(?:['\u2019\u02BC\u0060\u00B4-]\p{L}+)*/gu;
const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/[^a-zçğıöşüâîû\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const meaning = (entry: PracticeGlossaryEntry) =>
  (
    entry.baseMeaning ||
    entry.simpleDefinition ||
    entry.definition ||
    ""
  ).trim();
const key = (entry: Pick<PracticeGlossaryEntry, "term" | "occurrenceIndex">) =>
  `${normalize(entry.term)}:${entry.occurrenceIndex}`;

export function listeningGlossaryTargets(transcript: string) {
  const counts = new Map<string, number>();
  return Array.from(transcript.matchAll(wordPattern), (match) => {
    const term = match[0];
    const normalized = normalize(term);
    const occurrenceIndex = (counts.get(normalized) || 0) + 1;
    counts.set(normalized, occurrenceIndex);
    return { term, occurrenceIndex };
  });
}

function entryFor(
  target: ReturnType<typeof listeningGlossaryTargets>[number],
  entries: PracticeGlossaryEntry[],
) {
  const matches = entries.filter(
    (entry) =>
      normalize(entry.term) === normalize(target.term) && meaning(entry),
  );
  return (
    matches.find((entry) => entry.occurrenceIndex === target.occurrenceIndex) ||
    matches.find((entry) => entry.occurrenceIndex == null)
  );
}

export function listeningGlossaryCoverage(section: PracticeSection) {
  const targets = listeningGlossaryTargets(section.transcript || "");
  const missing = targets.filter(
    (target) => !entryFor(target, section.glossaryEntries || []),
  );
  return {
    total: targets.length,
    covered: targets.length - missing.length,
    missing,
  };
}

/** Use the reading glossary's complete-word generator and explanation rules. */
export function listeningGlossaryRequest(
  section: PracticeSection,
  label: string,
): ReadingPracticeGlossaryGenerationRequest {
  const targets = listeningGlossaryTargets(section.transcript || "");
  return {
    title: section.title || "Dinleme pratiği",
    paragraphs: [{ label, text: section.transcript || "" }],
    existingEntries: targets.flatMap((target, index) => {
      const entry = entryFor(target, section.glossaryEntries || []);
      return entry
        ? [
            {
              ...entry,
              term: target.term,
              order: index + 1,
              definition: meaning(entry),
              occurrenceIndex: target.occurrenceIndex,
              paragraphLabel: label,
            },
          ]
        : [];
    }),
  };
}

/** Reject off-text output and keep any meanings edited while generation was running. */
export function mergeListeningGlossary(
  section: PracticeSection,
  generated: ReadingPracticeGlossaryEntry[],
  label: string,
) {
  const entries = [...(section.glossaryEntries || [])];
  const targets = new Map(
    listeningGlossaryTargets(section.transcript || "").map((target) => [
      key(target),
      target,
    ]),
  );
  for (const entry of generated) {
    const target = targets.get(key(entry));
    if (
      entry.paragraphLabel !== label ||
      !target ||
      !meaning(entry) ||
      entryFor(target, entries)
    )
      continue;
    entries.push({
      term: target.term,
      occurrenceIndex: target.occurrenceIndex,
      baseForm: entry.baseForm,
      baseMeaning: meaning(entry),
      definition: meaning(entry),
      simpleDefinition: meaning(entry),
    });
  }
  return entries;
}
