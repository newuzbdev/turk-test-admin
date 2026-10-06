import type {
  LearnPublishStatus,
  ReorderLearnStructureItem,
} from "./course-types";

export const getAllowedStructureStatuses = (
  status: LearnPublishStatus
): LearnPublishStatus[] => {
  if (status === "ARCHIVED") return ["DRAFT"];
  if (status === "DRAFT") return ["PUBLISHED", "ARCHIVED"];
  return ["DRAFT", "ARCHIVED"];
};

export const buildStructureReorder = <T extends { id: string }>(
  items: T[],
  itemId: string,
  direction: "up" | "down"
): ReorderLearnStructureItem[] | null => {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  if (currentIndex < 0) return null;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (!items[targetIndex]) return null;

  const reordered = [...items];
  [reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex],
  ];

  return reordered.map((item, sortOrder) => ({
    id: item.id,
    sortOrder,
  }));
};
