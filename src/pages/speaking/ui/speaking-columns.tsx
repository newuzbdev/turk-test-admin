import { Button, Dropdown, Tag } from "antd";
import type { MenuProps, TableColumnsType } from "antd";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

import { formatExamListDate } from "@/shared/components/exam-list-format";
import { ExamTitleCell } from "@/shared/components/exam-list-ui";
import type { SpeakingListRow } from "@/pages/speaking-v2/types";

type SpeakingColumnActions = {
  revisionPending: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRevise: (id: string) => void;
  onArchive: (id: string) => void;
};

const lifecycleLabel = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivde",
} as const;

function actionItems(
  row: SpeakingListRow,
  actions: SpeakingColumnActions,
): MenuProps["items"] {
  if (row.isDeleted) return [];
  if (row.formatVersion === 1) {
    return [
      {
        key: "view",
        label: "Salt okunur görüntüle",
        onClick: () => actions.onOpen(row.id),
      },
    ];
  }
  if (row.status === "DRAFT") {
    return [
      {
        key: "edit",
        label: "Taslağı düzenle",
        onClick: () => actions.onEdit(row.id),
      },
      { type: "divider" },
      {
        key: "delete",
        label: "Taslağı sil",
        danger: true,
        onClick: () => actions.onDelete(row.id),
      },
    ];
  }
  const shared: MenuProps["items"] = [
    { key: "view", label: "Görüntüle", onClick: () => actions.onOpen(row.id) },
    {
      key: "revise",
      label: "Yeni sürüm oluştur",
      disabled: actions.revisionPending,
      onClick: () => actions.onRevise(row.id),
    },
  ];

  return row.status === "PUBLISHED"
    ? [
        ...shared,
        { type: "divider" },
        {
          key: "archive",
          label: "Arşivle",
          onClick: () => actions.onArchive(row.id),
        },
      ]
    : shared;
}

export const SpeakingColumns = (
  actions: SpeakingColumnActions,
): TableColumnsType<SpeakingListRow> => [
  {
    key: "title",
    title: "Sınav",
    dataIndex: "title",
    render: (_title, record) =>
      record.isDeleted ? (
        <ExamTitleCell title={record.title} packageTitle={record.ielts.title} />
      ) : (
        <Link
          to={`/speaking/${record.id}/edit`}
          style={{ color: "inherit", display: "block", textDecoration: "none" }}
        >
          <ExamTitleCell
            title={record.title}
            packageTitle={record.ielts.title}
          />
        </Link>
      ),
  },
  {
    key: "status",
    title: "Durum",
    width: 120,
    render: (_value, record) => (
      <Tag
        color={
          !record.isDeleted && record.status === "PUBLISHED"
            ? "green"
            : "default"
        }
      >
        {record.isDeleted ? "Arşivde" : lifecycleLabel[record.status]}
      </Tag>
    ),
  },
  {
    key: "updatedAt",
    title: "Güncellendi",
    dataIndex: "updatedAt",
    width: 140,
    render: (date) => (
      <span className="exam-list-date">{formatExamListDate(date)}</span>
    ),
  },
  {
    key: "actions",
    title: "",
    align: "right" as const,
    width: 88,
    render: (_value, record) =>
      record.isDeleted ? null : (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: actionItems(record, actions),
            onClick: ({ domEvent }) => domEvent.stopPropagation(),
          }}
        >
          <Button
            type="text"
            icon={<MoreHorizontal />}
            aria-label={`${record.title} işlemleri`}
            onClick={(event) => event.stopPropagation()}
          />
        </Dropdown>
      ),
  },
];
