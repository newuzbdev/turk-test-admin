import type {
  LearnLevel,
  LearnSkillTag,
  LearnSkillTagLink,
  SkillTagCategory,
} from "./course-types";
import { getLearnLevelLabel, LEARN_LEVEL_OPTIONS } from "./course-utils";

export const SKILL_TAG_CATEGORY_LABELS: Record<SkillTagCategory, string> = {
  GRAMMAR: "Gramer",
  VOCABULARY: "Kelime",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
  EXAM_STRATEGY: "Sınav stratejisi",
  FUNCTIONAL_TURKISH: "Günlük Türkçe",
};

export const SKILL_TAG_CATEGORY_COLORS: Record<SkillTagCategory, string> = {
  GRAMMAR: "blue",
  VOCABULARY: "purple",
  READING: "cyan",
  LISTENING: "geekblue",
  WRITING: "orange",
  SPEAKING: "green",
  EXAM_STRATEGY: "red",
  FUNCTIONAL_TURKISH: "gold",
};

export const SKILL_TAG_CATEGORY_OPTIONS = (
  Object.keys(SKILL_TAG_CATEGORY_LABELS) as SkillTagCategory[]
).map((value) => ({
  value,
  label: SKILL_TAG_CATEGORY_LABELS[value],
}));

export const SKILL_TAG_LEVEL_OPTIONS: Array<{
  value: LearnLevel;
  label: string;
}> = [...LEARN_LEVEL_OPTIONS];

export const buildSkillTagLinkPayload = (skillTagIds: string[]) => ({
  items: Array.from(new Set(skillTagIds.filter(Boolean))).map((skillTagId) => ({
    skillTagId,
    weight: 1,
  })),
});

export const formatSkillTagOptionLabel = (tag: {
  title: string;
  key: string;
  category: SkillTagCategory;
  level: LearnLevel | null;
}) => {
  const levelLabel = tag.level ? getLearnLevelLabel(tag.level) : "Genel";
  return `${tag.title} · ${SKILL_TAG_CATEGORY_LABELS[tag.category]} · ${levelLabel}`;
};

export const mergeActiveTagsWithLinkedTags = (
  activeTags: LearnSkillTag[],
  links: LearnSkillTagLink[]
): LearnSkillTag[] => {
  const byId = new Map<string, LearnSkillTag>();

  activeTags.forEach((tag) => byId.set(tag.id, tag));
  links.forEach((link) => {
    if (byId.has(link.skillTag.id)) return;
    byId.set(link.skillTag.id, {
      ...link.skillTag,
      createdAt: link.createdAt,
      updatedAt: link.createdAt,
      parent: null,
      _count: { children: 0, lessonLinks: 0, questionLinks: 0 },
    });
  });

  return Array.from(byId.values());
};
