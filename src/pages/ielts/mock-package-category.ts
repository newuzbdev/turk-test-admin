import type { MockPackageCategory } from "@/utils/types/types";

export const mockPackageCategories: { value: MockPackageCategory; label: string }[] = [
  { value: "CEFR_MOCK", label: "CEFR MOCK (tam deneme)" },
  { value: "LISTENING", label: "Dinleme" },
  { value: "READING", label: "Okuma" },
  { value: "WRITING", label: "Yazma" },
  { value: "SPEAKING", label: "Konuşma" },
];

export const mockPackageCategoryLabel = (category?: MockPackageCategory) =>
  mockPackageCategories.find((item) => item.value === category)?.label ?? "CEFR MOCK (tam deneme)";
