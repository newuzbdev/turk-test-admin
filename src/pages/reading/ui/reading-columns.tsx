import { useExamListView } from "@/shared/components/exam-list-view";
import { Button, Dropdown, Popconfirm, Tag, Tooltip } from "antd";
import {
  CircleStop,
  Copy,
  MoreHorizontal,
  Pencil,
  Settings2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { formatExamListDate } from "@/shared/components/exam-list-format";
import { ExamTitleCell } from "@/shared/components/exam-list-ui";
import type { Test } from "@/utils/types/types";

interface ReadingColumnsProps {
  onEdit: (data: Test) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string) => void;
  onPublish: (id: string) => void;
  onMoveToDraft: (id: string) => void;
}

export const ReadingColumns = ({
  onEdit,
  onDelete,
  onCopyId,
  onPublish,
  onMoveToDraft,
}: ReadingColumnsProps) => {
  const navigate = useNavigate();
  const { view } = useExamListView();

  return [
    {
      key: "title",
      title: "Test",
      dataIndex: "title",
      render: (_: string, record: Test) => (
        <ExamTitleCell
          title={record.title}
          packageTitle={record.ielts?.title}
        />
      ),
    },
    {
      key: "status",
      title: "Durum",
      width: 120,
      render: (_: unknown, record: Test) => {
        return (
          <Tag
            color={
              view !== "ARCHIVED" &&
              !record.isDeleted &&
              record.status === "PUBLISHED"
                ? "green"
                : "default"
            }
          >
            {view === "ARCHIVED" || record.isDeleted
              ? "Arşivde"
              : record.status === "PUBLISHED"
                ? "Yayında"
                : "Taslak"}
          </Tag>
        );
      },
    },
    {
      key: "updatedAt",
      title: "Son güncelleme",
      dataIndex: "updatedAt",
      width: 150,
      render: (date: string) => (
        <span className="exam-list-date">{formatExamListDate(date)}</span>
      ),
    },
    {
      key: "actions",
      title: "",
      align: "right" as const,
      width: 108,
      render: (_: unknown, record: Test) => {
        const id = record.id;
        if (view === "ARCHIVED" || record.isDeleted) return null;
        const openEditor = () => {
          if (id) navigate(`/reading/${id}/edit-v3`);
        };

        return (
          <div
            className="exam-list-actions"
            onClick={(event) => event.stopPropagation()}
          >
            <Tooltip title="Düzenlemeye devam et">
              <Button
                aria-label="Okuma testini düzenle"
                icon={<Pencil />}
                type="text"
                onClick={openEditor}
              />
            </Tooltip>

            {record.status === "PUBLISHED" ? (
              <Popconfirm
                title="Testi taslağa alın"
                description="Öğrenciler bu testi artık başlatamaz."
                okText="Taslağa al"
                cancelText="Vazgeç"
                onConfirm={() => id && onMoveToDraft(id)}
              >
                <Tooltip title="Taslağa al">
                  <Button
                    aria-label="Okuma testini taslağa al"
                    icon={<CircleStop />}
                    type="text"
                  />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Tooltip
                title={
                  record.publicationReadiness?.ready
                    ? "Yayınla"
                    : "Önce yayın hazırlığındaki eksikleri tamamlayın"
                }
              >
                <span>
                  <Button
                    aria-label="Okuma testini yayınla"
                    disabled={!record.publicationReadiness?.ready}
                    icon={<UploadCloud />}
                    type="text"
                    onClick={() => id && onPublish(id)}
                  />
                </span>
              </Tooltip>
            )}

            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "details",
                    icon: <Settings2 size={15} />,
                    label: "Temel bilgileri düzenle",
                  },
                  {
                    key: "copy",
                    icon: <Copy size={15} />,
                    label: "ID'yi kopyala",
                  },
                  { type: "divider" },
                  {
                    key: "delete",
                    danger: true,
                    icon: <Trash2 size={15} />,
                    label: "Arşivle",
                  },
                ],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  if (key === "details") onEdit(record);
                  if (key === "copy" && id) onCopyId(id);
                  if (key === "delete" && id) onDelete(id);
                },
              }}
            >
              <Button
                aria-label="Diğer okuma testi işlemleri"
                icon={<MoreHorizontal />}
                type="text"
                onClick={(event) => event.stopPropagation()}
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];
};
