import ContentAccessControls from "@/components/access/ContentAccessControls";
import { Button, Dropdown, Tag, type TableColumnsType } from "antd";
import { Archive, Copy, MoreHorizontal, Pencil } from "lucide-react";
import type { IELTS } from "@/utils/types/types";
import type { AdminIeltsRow } from "@/config/queries/ielts/get-all.queries";
import { formatExamListDate } from "@/shared/components/exam-list-format";
import { ExamTitleCell } from "@/shared/components/exam-list-ui";
import { mockPackageCategoryLabel } from "../mock-package-category";

export const IeltsColumns = ({
  onEdit,
  onDelete,
  onCopyId,
  onAccessChanged,
}: {
  onEdit: (data: IELTS) => void;
  onDelete: (id: string) => void;
  onCopyId: (id: string) => void;
  onAccessChanged?:()=>void;
}): TableColumnsType<AdminIeltsRow> => [
 {title:"Erişim",render:(_,row)=><ContentAccessControls target={{scope:"MOCK_PACKAGE",targetId:row.id}} row={row} onChanged={onAccessChanged}/>},
  {
    key: "title",
    title: "Deneme",
    render: (_, row) => <ExamTitleCell title={row.title} />,
  },
  {
    key: "category",
    title: "Sekme",
    width: 170,
    render: (_, row) => mockPackageCategoryLabel(row.category),
  },
  {
    key: "status",
    title: "Durum",
    width: 120,
    render: (_, row) => (
      <Tag color={row.status === "PUBLISHED" ? "green" : "default"}>
        {
          { PUBLISHED: "Yayında", DRAFT: "Taslak", ARCHIVED: "Arşivde" }[
            row.status
          ]
        }
      </Tag>
    ),
  },
  {
    key: "updatedAt",
    title: "Son güncelleme",
    width: 160,
    render: (_, row) => (
      <span className="exam-list-date">
        {formatExamListDate(row.updatedAt)}
      </span>
    ),
  },
  {
    key: "actions",
    title: "",
    width: 60,
    align: "right",
    render: (_, row) => (
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            ...(!row.isDeleted
              ? [
                  {
                    key: "edit",
                    icon: <Pencil size={15} />,
                    label: "Denemeyi düzenle",
                  },
                ]
              : []),
            { key: "copy", icon: <Copy size={15} />, label: "ID'yi kopyala" },
            ...(!row.isDeleted
              ? [
                  { type: "divider" as const },
                  {
                    key: "archive",
                    icon: <Archive size={15} />,
                    label: "Arşivle",
                    danger: true,
                  },
                ]
              : []),
          ],
          onClick: ({ key }) => {
            if (key === "edit") onEdit(row);
            if (key === "copy" && row.id) onCopyId(row.id);
            if (key === "archive" && row.id) onDelete(row.id);
          },
        }}
      >
        <Button
          type="text"
          icon={<MoreHorizontal size={18} />}
          aria-label={`${row.title} işlemleri`}
        />
      </Dropdown>
    ),
  },
];
