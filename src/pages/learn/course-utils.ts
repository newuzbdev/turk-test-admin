import type {
  LearnCourse,
  LearnLevel,
  LearnPublishStatus,
  ReorderLearnCourseItem,
} from "./course-types";

export const LEARN_LEVEL_OPTIONS: Array<{
  value: LearnLevel;
  label: string;
}> = [
  { value: "STARTER", label: "Sıfırdan Başla" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
];

export const LEARN_STATUS_LABELS: Record<LearnPublishStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivlendi",
};

export const LEARN_STATUS_ACTION_LABELS: Record<LearnPublishStatus, string> = {
  DRAFT: "Taslağa al",
  PUBLISHED: "Yayınla",
  ARCHIVED: "Arşivle",
};

export const getLearnLevelLabel = (level: LearnLevel) =>
  LEARN_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;

export const getAllowedCourseStatuses = (
  status: LearnPublishStatus
): LearnPublishStatus[] => {
  if (status === "ARCHIVED") return ["DRAFT"];
  if (status === "DRAFT") return ["PUBLISHED", "ARCHIVED"];
  return ["DRAFT", "ARCHIVED"];
};

export const buildCourseReorder = (
  courses: LearnCourse[],
  courseId: string,
  direction: "up" | "down"
): ReorderLearnCourseItem[] | null => {
  const currentIndex = courses.findIndex((course) => course.id === courseId);
  if (currentIndex < 0) return null;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const target = courses[targetIndex];
  const current = courses[currentIndex];

  if (!target || target.level !== current.level) return null;

  const reordered = [...courses];
  [reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex],
  ];

  return reordered.map((course, sortOrder) => ({
    id: course.id,
    sortOrder,
  }));
};
