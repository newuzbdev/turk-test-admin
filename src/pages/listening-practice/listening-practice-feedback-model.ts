export type PracticeAnswer = {
  id?: string;
  variantText?: string;
  answer?: string;
  correct?: boolean;
};
export type PracticeQuestion = {
  id: string;
  number: number;
  text?: string;
  content?: string;
  type?: string;
  imageUrl?: string | null;
  answers: PracticeAnswer[];
  evidence?: PracticeEvidence;
};
export type PracticeGlossaryEntry = {
  term: string;
  baseForm?: string;
  baseMeaning?: string;
  definition?: string;
  simpleDefinition?: string;
  occurrenceIndex?: number | null;
};
export type PracticeSection = {
  glossaryEntries?: PracticeGlossaryEntry[];
  id?: string;
  title?: string;
  transcript?: string;
  content?: string;
  imageUrl?: string | null;
  questions: PracticeQuestion[];
  transcriptAlignment?: unknown;
};
export type PracticeContent = {
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  parts: {
    number?: number;
    description?: string;
    sections: PracticeSection[];
  }[];
};

export type PracticeEvidence = {
  evidenceText?: string;
  textStart?: number | null;
  textEnd?: number | null;
  explanation?: string;
  audioStartMs?: number | null;
  audioEndMs?: number | null;
  evidenceSpans?: {
    evidenceText: string;
    textStart: number;
    textEnd: number;
  }[];
};

export function selectPracticeEvidence(
  transcript: string,
  start: number,
  end: number,
  previous: PracticeEvidence = {},
): PracticeEvidence {
  const raw = transcript.slice(start, end);
  const leading = raw.length - raw.trimStart().length;
  const text = raw.trim();
  if (!text) return previous;
  return {
    ...previous,
    evidenceText: text,
    textStart: start + leading,
    textEnd: start + leading + text.length,
    evidenceSpans: [],
    audioStartMs: null,
    audioEndMs: null,
  };
}

export function changePracticeTranscript(
  section: PracticeSection,
  transcript: string,
) {
  if (transcript === section.transcript) return section;
  // Old offsets and audio timing cannot be trusted after changing the source.
  return {
    ...section,
    transcript,
    content: transcript,
    transcriptAlignment: null,
    questions: (section.questions ?? []).map((question) => ({
      ...question,
      evidence: question.evidence
        ? { explanation: question.evidence.explanation ?? "" }
        : undefined,
    })),
  };
}

export function changePracticeAudio(
  content: PracticeContent,
  audioUrl: string,
) {
  if (audioUrl === content.audioUrl) return content;
  return {
    ...content,
    audioUrl,
    audioDurationSeconds: null,
    parts: (content.parts ?? []).map((part) => ({
      ...part,
      sections: (part.sections ?? []).map((section) => ({
        ...section,
        transcriptAlignment: null,
        questions: (section.questions ?? []).map((question) => ({
          ...question,
          evidence: question.evidence
            ? { ...question.evidence, audioStartMs: null, audioEndMs: null }
            : undefined,
        })),
      })),
    })),
  };
}

export function practiceFeedbackIssues(
  section: Pick<PracticeSection, "transcript">,
  question: Partial<PracticeQuestion>,
  duration?: number | null,
): string[] {
  const evidence: PracticeEvidence = question.evidence ?? {};
  const transcript = String(section.transcript ?? "");
  const spans = evidence.evidenceSpans?.length
    ? evidence.evidenceSpans
    : [evidence];
  const issues: string[] = [];
  if (!question.answers?.some((answer) => answer.correct))
    issues.push("Doğru cevap seçilmedi");
  if (!transcript) issues.push("Transkript eksik");
  if (
    spans.some(
      (span) =>
        !span.evidenceText ||
        !Number.isInteger(span.textStart) ||
        !Number.isInteger(span.textEnd) ||
        Number(span.textStart) < 0 ||
        Number(span.textEnd) <= Number(span.textStart) ||
        transcript.slice(Number(span.textStart), Number(span.textEnd)) !==
          span.evidenceText,
    )
  )
    issues.push("Transkriptten cevap cümlesi seçin");
  if (!evidence.explanation?.trim()) issues.push("Kısa açıklama eksik");
  const { audioStartMs: start, audioEndMs: end } = evidence;
  if (
    start == null ||
    end == null ||
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end <= start ||
    (duration && end > duration * 1000)
  )
    issues.push("Ses aralığını belirleyin");
  return issues;
}
