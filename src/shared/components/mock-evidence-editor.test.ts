import { describe, expect, it } from "vitest";
import {
  applyEvidenceSelection,
  evidenceMatchesSource,
  secondsToMilliseconds,
} from "./mock-evidence-editor.helpers";

describe("mock evidence editor helpers", () => {
  it("stores the exact selected source text and offsets", () => {
    const source = "Otobüs saat dokuzda hareket edecek.";
    const start = source.indexOf("saat dokuzda");
    expect(applyEvidenceSelection(source, start, start + 12)).toEqual({
      evidenceText: "saat dokuzda",
      textStart: start,
      textEnd: start + 12,
    });
  });

  it("detects stale evidence after source content changes", () => {
    const evidenceText = "Kediler sessizdir";
    expect(
      evidenceMatchesSource("Kediler sessizdir.", {
        evidenceText,
        textStart: 0,
        textEnd: evidenceText.length,
      }),
    ).toBe(true);
    expect(
      evidenceMatchesSource("Kediler hareketlidir.", {
        evidenceText,
        textStart: 0,
        textEnd: evidenceText.length,
      }),
    ).toBe(false);
  });

  it("converts admin seconds to integer milliseconds", () => {
    expect(secondsToMilliseconds(2.345)).toBe(2345);
    expect(secondsToMilliseconds(null)).toBeNull();
  });
});
