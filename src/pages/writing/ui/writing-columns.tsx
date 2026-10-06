import { Button, Dropdown, Tag, Tooltip } from "antd";
import { Archive, Copy, Eye, MoreHorizontal, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { formatExamListDate } from "@/shared/components/exam-list-format";
import { ExamTitleCell } from "@/shared/components/exam-list-ui";
import type { WritingTest } from "@/utils/types/types";

interface WritingColumnsProps {
  onArchive: (id: string) => void;
  onCopyId: (id: string) => void;
}

const getStatus = (record: WritingTest) =>
  !record.isDeleted && record.formatVersion === 2
    ? record.status || "DRAFT"
    : "ARCHIVED";

export const WritingColumns = ({
  onArchive,
  onCopyId,
}: WritingColumnsProps) => {
  const navigate = useNavigate();

  return [
    {
      key: "title",
      title: "Test",
      dataIndex: "title",
      render: (_: string | null, record: WritingTest) => (
        <ExamTitleCell
          title={record.title}
          packageTitle={record.ielts?.title}
        />
      ),
    },
    {
      key: "status",
      title: "Durum",
      width: 160,
      render: (_: unknown, record: WritingTest) => {
        const status = getStatus(record);
        const labels = {
          DRAFT: "Taslak",
          PUBLISHED: "Yayında",
          ARCHIVED: "Arşiv",
        };

        return (
          <div className="exam-list-status">
            <Tag
              color={
                status === "PUBLISHED"
                  ? "green"
                  : status === "ARCHIVED"
                    ? "gold"
                    : "default"
              }
            >
              {labels[status]}
            </Tag>
          </div>
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
      width: 76,
      render: (_: unknown, record: WritingTest) => {
        const id = record.id;
        const isV2 = record.formatVersion === 2 && !record.isDeleted;
        const archived = getStatus(record) === "ARCHIVED";

        return (
          <div
            className="exam-list-actions"
            onClick={(event) => event.stopPropagation()}
          >
            {isV2 ? (
              <Tooltip title={archived ? "Görüntüle" : "Düzenlemeye devam et"}>
                <Button
                  aria-label={
                    archived
                      ? "Yazma testini görüntüle"
                      : "Yazma testini düzenle"
                  }
                  icon={archived ? <Eye /> : <Pencil />}
                  type="text"
                  onClick={() => id && navigate(`/writing/${id}/edit-v2`)}
                />
              </Tooltip>
            ) : null}

            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "copy",
                    icon: <Copy size={15} />,
                    label: "ID'yi kopyala",
                  },
                  ...(isV2 && !archived
                    ? [
                        { type: "divider" as const },
                        {
                          key: "archive",
                          danger: true,
                          icon: <Archive size={15} />,
                          label: "Arşivle",
                        },
                      ]
                    : []),
                ],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  if (key === "copy" && id) onCopyId(id);
                  if (key === "archive" && id) onArchive(id);
                },
              }}
            >
              <Button
                aria-label="Diğer yazma testi işlemleri"
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
