import { describe, expect, it } from "vitest";
import {
  buildReadingPracticeListQuery,
  getReadingPracticeLevelLabel,
} from "./reading-practice-filters";

describe("reading practice filters", () => {
  it("builds a combined server query for level and section", () => {
    expect(
      buildReadingPracticeListQuery({
        searchText: "  Kent yaşamı  ",
        level: "B2",
        section: 2,
        page: 3,
        limit: 10,
      }),
    ).toEqual({
      page: 3,
      limit: 10,
      search: "Kent yaşamı",
      level: "B2",
      practiceType: "SECTION",
      sectionNumber: 2,
    });
  });

  it("keeps Multilevel as a distinct level query", () => {
    expect(
      buildReadingPracticeListQuery({
        searchText: "",
        level: "MULTILEVEL",
        section: "ALL",
        page: 1,
        limit: 10,
      }),
    ).toEqual({ page: 1, limit: 10, level: "MULTILEVEL" });
    expect(getReadingPracticeLevelLabel("multi level")).toBe("Multilevel");
  });

  it("omits optional filters when all records are requested", () => {
    expect(
      buildReadingPracticeListQuery({
        searchText: "",
        level: "ALL",
        section: "ALL",
        page: 1,
        limit: 10,
      }),
    ).toEqual({ page: 1, limit: 10 });
  });
});
