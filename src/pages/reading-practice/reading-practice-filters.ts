import type { ReadingPracticeListQuery } from "@/utils/types/types";

export const READING_PRACTICE_LEVEL_OPTIONS = [
  { value: "ALL", label: "Tüm seviyeler" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "MULTILEVEL", label: "Multilevel" },
] as const;

export const READING_PRACTICE_SECTION_OPTIONS = [
  { value: "ALL", label: "Tüm bölümler" },
  { value: 1, label: "Bölüm 1" },
  { value: 2, label: "Bölüm 2" },
  { value: 3, label: "Bölüm 3" },
  { value: 4, label: "Bölüm 4" },
  { value: 5, label: "Bölüm 5" },
] as const;

export type ReadingPracticeLevelFilter =
  (typeof READING_PRACTICE_LEVEL_OPTIONS)[number]["value"];
export type ReadingPracticeSectionFilter =
  (typeof READING_PRACTICE_SECTION_OPTIONS)[number]["value"];

function normalizeLevel(value?: string) {
  const normalized = value?.trim().toUpperCase().replace(/[\s_-]+/g, "");
  return normalized === "MULTILEVEL" ? "MULTILEVEL" : normalized;
}

export function getReadingPracticeLevelLabel(value?: string) {
  return normalizeLevel(value) === "MULTILEVEL" ? "Multilevel" : value || "-";
}

export function buildReadingPracticeListQuery(filters: {
  searchText: string;
  level: ReadingPracticeLevelFilter;
  section: ReadingPracticeSectionFilter;
  page: number;
  limit: number;
}): ReadingPracticeListQuery {
  const search = filters.searchText.trim();
  const query: ReadingPracticeListQuery = {
    page: filters.page,
    limit: filters.limit,
  };

  if (search) query.search = search;
  if (filters.level !== "ALL") query.level = filters.level;
  if (filters.section !== "ALL") {
    query.practiceType = "SECTION";
    query.sectionNumber = filters.section;
  }

  return query;
}
