import { describe, expect, it } from "vitest";
import type { LearnSkillTag, LearnSkillTagLink } from "./course-types";
import {
  buildSkillTagLinkPayload,
  formatSkillTagOptionLabel,
  mergeActiveTagsWithLinkedTags,
  SKILL_TAG_CATEGORY_LABELS,
} from "./skill-tag-utils";

const tag = (overrides: Partial<LearnSkillTag>): LearnSkillTag => ({
  id: "tag-1",
  key: "grammar.isim-cumlesi",
  title: "İsim cümlesi",
  description: null,
  category: "GRAMMAR",
  level: "A1",
  parentId: null,
  isActive: true,
  createdAt: "",
  updatedAt: "",
  parent: null,
  _count: { children: 0, lessonLinks: 0, questionLinks: 0 },
  ...overrides,
});

describe("SkillTag frontend helpers", () => {
  it("keeps labels human-readable for admin filters", () => {
    expect(SKILL_TAG_CATEGORY_LABELS.GRAMMAR).toBe("Gramer");
    expect(
      formatSkillTagOptionLabel({
        title: "İsim cümlesi",
        key: "grammar.isim-cumlesi",
        category: "GRAMMAR",
        level: "STARTER",
      })
    ).toContain("Sıfırdan Başla");
  });

  it("builds duplicate-free link payload with hidden default weight", () => {
    expect(buildSkillTagLinkPayload(["tag-1", "tag-1", "tag-2"])).toEqual({
      items: [
        { skillTagId: "tag-1", weight: 1 },
        { skillTagId: "tag-2", weight: 1 },
      ],
    });
  });

  it("keeps inactive linked tags visible without duplicating active options", () => {
    const active = [tag({ id: "tag-1" })];
    const links: LearnSkillTagLink[] = [
      {
        id: "link-1",
        lessonId: "lesson-1",
        skillTagId: "tag-2",
        weight: 1,
        createdAt: "2026-01-01",
        skillTag: {
          id: "tag-2",
          key: "reading.ana-fikir",
          title: "Ana fikir bulma",
          description: null,
          category: "READING",
          level: null,
          parentId: null,
          isActive: false,
        },
      },
    ];

    expect(mergeActiveTagsWithLinkedTags(active, links).map((item) => item.id))
      .toEqual(["tag-1", "tag-2"]);
  });
});
