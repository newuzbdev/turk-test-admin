import { describe, expect, it } from "vitest";
import {
  toAccessUtc,
  fromAccessUtc,
  defaultPlatformLimits,
} from "./access-time";
describe("UTC+5 access calendar", () => {
  it("crosses year boundaries independently of host timezone", () => {
    expect(
      toAccessUtc({ year: 2027, month: 1, day: 1, hour: 0, minute: 0 }),
    ).toBe("2026-12-31T19:00:00.000Z");
    expect(fromAccessUtc("2026-12-31T19:00:00.000Z")).toEqual({
      year: 2027,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
    });
  });
  it("rejects impossible dates", () => {
    expect(() =>
      toAccessUtc({ year: 2027, month: 2, day: 29, hour: 0, minute: 0 }),
    ).toThrow();
  });
  it("uses approved platform defaults", () => {
    expect(defaultPlatformLimits).toEqual({
      MOCK_WRITING: 10,
      MOCK_SPEAKING: 10,
      PRACTICE_AI: 120,
    });
  });
});
