import { Input, Segmented } from "antd";
import { Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import "./exam-list-ui.css";
import {
  examListViews,
  useExamListView,
  type ExamListView,
} from "./exam-list-view";

type ExamListHeaderProps = {
  title: string;
  description?: string;
  action: ReactNode;
  searchValue?: string;
  onSearch?: (value: string) => void;
};

export function ExamListHeader({
  title,
  description,
  action,
  searchValue = "",
  onSearch,
}: ExamListHeaderProps) {
  const { view, setView } = useExamListView();
  const [value, setValue] = useState(searchValue);

  useEffect(() => {
    setValue(searchValue);
  }, [searchValue]);

  return (
    <div className="exam-list-header-wrap">
      <div className="exam-list-header">
        <div className="exam-list-heading">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>

        <div className="exam-list-toolbar">
          {onSearch ? (
            <Input
              allowClear
              aria-label={`${title} içinde ara`}
              className="exam-list-search"
              placeholder="Test ara"
              prefix={<Search size={15} aria-hidden="true" />}
              value={value}
              onChange={(event) => {
                const nextValue = event.target.value;
                setValue(nextValue);
                if (!nextValue && searchValue) onSearch("");
              }}
              onPressEnter={() => onSearch(value.trim())}
            />
          ) : null}
          {action}
        </div>
      </div>
      <Segmented
        className="exam-list-views"
        aria-label="Test durumu"
        value={view}
        options={[...examListViews]}
        onChange={(value) => setView(value as ExamListView)}
      />
    </div>
  );
}

export function ExamTitleCell({
  title,
  packageTitle,
  detail,
}: {
  title?: string | null;
  packageTitle?: string | null;
  detail?: string | null;
}) {
  return (
    <div className="exam-list-test-cell">
      <span className="exam-list-test-title">
        {title?.trim() || "Adsız taslak"}
      </span>
      {(packageTitle || detail) && (
        <span className="exam-list-test-meta">
          {[packageTitle, detail].filter(Boolean).join(" · ")}
        </span>
      )}
    </div>
  );
}
