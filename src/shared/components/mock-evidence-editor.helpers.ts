export interface MockEvidenceDraft {
  evidenceText?: string;
  explanation?: string;
  textStart?: number;
  textEnd?: number;
  audioStartMs?: number;
  audioEndMs?: number;
  distractorExplanations?: Record<string, string>;
}

export const applyEvidenceSelection = (
  source: string,
  start: number,
  end: number,
): Pick<MockEvidenceDraft, "evidenceText" | "textStart" | "textEnd"> => ({
  evidenceText: source.slice(start, end),
  textStart: start,
  textEnd: end,
});

export const evidenceMatchesSource = (
  source: string,
  evidence?: MockEvidenceDraft | null,
): boolean => {
  if (!evidence?.evidenceText) return false;
  const start = Number(evidence.textStart);
  const end = Number(evidence.textEnd);
  return (
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end > start &&
    end <= source.length &&
    source.slice(start, end) === evidence.evidenceText
  );
};

export const secondsToMilliseconds = (
  seconds: number | null | undefined,
): number | null => {
  if (seconds == null) return null;
  const value = Number(seconds);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 1000) : null;
};

export const millisecondsToSeconds = (
  milliseconds: number | null | undefined,
): number | null => {
  if (milliseconds == null) return null;
  const value = Number(milliseconds);
  return Number.isFinite(value) && value >= 0 ? value / 1000 : null;
};
