import type { AccessScope, LimitField } from "@/config/queries/access";
export class RequestIntent {
  private fingerprint = "";
  private id = "";
  forPayload(payload: object): string {
    const next = JSON.stringify(payload);
    if (next !== this.fingerprint) {
      this.fingerprint = next;
      this.id = crypto.randomUUID();
    }
    return this.id;
  }
  clear() {
    this.fingerprint = "";
    this.id = "";
  }
}
export function relevantLimitFields(
  scope: AccessScope,
  buckets?: string[],
): LimitField[] {
  if (scope === "PLATFORM")
    return ["writingMockLimit", "speakingMockLimit", "practiceAiLimit"];
  if (scope === "MOCK_PACKAGE")
    return (buckets ?? []).flatMap((bucket) =>
      bucket === "MOCK_WRITING"
        ? ["writingMockLimit" as const]
        : bucket === "MOCK_SPEAKING"
          ? ["speakingMockLimit" as const]
          : [],
    );
  if (scope === "MOCK_WRITING") return ["writingMockLimit"];
  if (scope === "MOCK_SPEAKING") return ["speakingMockLimit"];
  if (scope === "PRACTICE_WRITING" || scope === "PRACTICE_SPEAKING")
    return ["practiceAiLimit"];
  return [];
}
