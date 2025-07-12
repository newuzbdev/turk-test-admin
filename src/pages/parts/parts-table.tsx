import { Table, Modal, notification } from "antd";
import { usePartsModalStore } from "./utils/parts-modal-store";
import { PartsModal } from "./ui/parts-modal";
import { useGetAllParts } from "@/config/queries/parts/get-all.queries";
import { useDeletePart } from "@/config/queries/parts/delete.queries";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PartsColumns } from "./ui/parts-columns";

export const PartsTable = () => {
  const { onOpen } = usePartsModalStore();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: parts, isLoading: isPartsLoading } = useGetAllParts();
  const deletePart = useDeletePart();

  const handleDelete = (partId: string) => {
    Modal.confirm({
      title: "Ishonchingiz komilmi?",
      content: "Ushbu qismni o'chirishni xoxlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      onOk: () => {
        deletePart.mutateAsync(partId);
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

  const tableData = parts?.data || [];

  return (
    <Table
      pagination={{
        total: parts?.meta?.total || 0,
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
          <h2>Qismlar</h2>
          <PartsModal />
        </div>
      )}
      size="small"
      loading={isPartsLoading}
      scroll={{ x: "max-content" }}
      dataSource={tableData}
      rowKey={(rec) => rec.id || ""}
      onRow={(record) => ({
        onClick: (e) => {
          if (!(e.target instanceof HTMLButtonElement)) {
            navigate(`/parts/${record.id}`);
          }
        },
      })}
      columns={PartsColumns({
        onEdit: onOpen,
        onDelete: handleDelete,
        onCopyId: handleCopyId,
        navigate,
      })}
    />
  );
};
