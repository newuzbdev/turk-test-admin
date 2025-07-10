import { Table, Modal, notification } from "antd";
import { useSectionsModalStore } from "./utils/sections-modal-store";
import { useGetAllSection } from "@/config/queries/section/get-all.queries";
import { useDeleteSection } from "@/config/queries/section/delete.queries";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { SectionsModal } from "./ui/sections-modal";
import { SectionsColumns } from "./ui/sections-columns";

export const SectionsTable = () => {
  const { onOpen } = useSectionsModalStore();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: sections, isLoading: isSectionsLoading } = useGetAllSection();
  const deleteSection = useDeleteSection();

  const handleDelete = (sectionId: string) => {
    Modal.confirm({
      title: "Ishonchingiz komilmi?",
      content: "Ushbu bo'limni o'chirishni xoxlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      onOk: () => {
        deleteSection.mutateAsync(sectionId);
      },
    });
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(id);
      notification.success({
        message: "Muvaffaqiyatli nusxa ko`chirildi",
      });
    } catch {
      notification.error({
        message: "Nusxa ko`chirishda xatolik yuz berdi",
      });
    }
  };

  const tableData = sections?.data || [];

  return (
    <Table
      pagination={{
        total: sections?.meta?.total || 0,
        pageSize: pageSize,
        current: currentPage,
        showSizeChanger: true,
        pageSizeOptions: [5, 10, 20, 50, 100],
        onChange: (page, size) => {
          setCurrentPage(page);
          setPageSize(size);
        },
      }}
      title={() => (
        <div className="flex items-center justify-between">
          <h2>Bo'limlar</h2>
          <SectionsModal />
        </div>
      )}
      size="small"
      loading={isSectionsLoading}
      scroll={{ x: "max-content" }}
      dataSource={tableData}
      rowKey={(rec) => rec.id || ""}
      onRow={(record) => ({
        onClick: (e) => {
          if (!(e.target instanceof HTMLButtonElement)) {
            navigate(`/sections/${record.id}`);
          }
        },
      })}
      columns={SectionsColumns({
        onEdit: onOpen,
        onDelete: handleDelete,
        onCopyId: handleCopyId,
        navigate,
      })}
    />
  );
};
