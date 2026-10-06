import { useSearchParams } from "react-router-dom";
export const examListViews = [
  { value: "PUBLISHED", label: "Yayında" },
  { value: "DRAFT", label: "Taslaklar" },
  { value: "ARCHIVED", label: "Arşiv" },
] as const;
export type ExamListView = (typeof examListViews)[number]["value"];
export function readExamListView(value: string | null): ExamListView {
  return value === "DRAFT" || value === "ARCHIVED" ? value : "PUBLISHED";
}
export function useExamListView() {
  const [params, setParams] = useSearchParams();
  const view = readExamListView(params.get("view"));
  const setView = (next: ExamListView) => {
    const updated = new URLSearchParams(params);
    updated.set("view", next);
    updated.set("page", "1");
    setParams(updated);
  };
  return { view, setView };
}
