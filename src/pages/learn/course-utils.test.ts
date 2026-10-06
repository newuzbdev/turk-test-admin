import { describe, expect, it } from "vitest";
import type { LearnCourse } from "./course-types";
import {
  buildCourseReorder,
  getAllowedCourseStatuses,
  getLearnLevelLabel,
} from "./course-utils";

const course = (
  id: string,
  level: LearnCourse["level"],
  sortOrder: number
): LearnCourse => ({
  id,
  level,
  sortOrder,
  slug: id,
  title: id,
  description: null,
  status: "DRAFT",
  thumbnailUrl: null,
  isFeatured: false,
  publishedAt: null,
  archivedAt: null,
  createdAt: "",
  updatedAt: "",
  _count: { modules: 0 },
});

describe("Learn course frontend helpers", () => {
  it("shows STARTER as Sıfırdan Başla", () => {
    expect(getLearnLevelLabel("STARTER")).toBe("Sıfırdan Başla");
  });

  it("does not allow an archived course to publish directly", () => {
    expect(getAllowedCourseStatuses("ARCHIVED")).toEqual(["DRAFT"]);
  });

  it("builds a complete reorder payload inside the same level", () => {
    const result = buildCourseReorder(
      [course("a1-one", "A1", 0), course("a1-two", "A1", 1)],
      "a1-two",
      "up"
    );

    expect(result).toEqual([
      { id: "a1-two", sortOrder: 0 },
      { id: "a1-one", sortOrder: 1 },
    ]);
  });

  it("does not move a course across level boundaries", () => {
    expect(
      buildCourseReorder(
        [course("starter", "STARTER", 0), course("a1", "A1", 1)],
        "a1",
        "up"
      )
    ).toBeNull();
  });
});
