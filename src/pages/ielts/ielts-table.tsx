import { Table, Modal, notification } from "antd";
import { useIeltsModalStore } from "./utils/ielts-modal-store";
import { IeltsModal } from "./ui/ielts-modal";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { IeltsColumns } from "./ui/ielts-columns";
import { useDeleteIelts, useGetAllIelts } from "@/config/queries";

export const IeltsTable = () => {
  const { onOpen } = useIeltsModalStore();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: ielts, isLoading: isIeltsLoading } = useGetAllIelts();
  const deleteIelts = useDeleteIelts();

  const handleDelete = (ieltsId: string) => {
    Modal.confirm({
      title: "Ishonchingiz komilmi?",
      content: "Ushbu IELTS testini o'chirishni xoxlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      onOk: () => {
        deleteIelts.mutateAsync(ieltsId);
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

  const tableData = ielts?.data || [];

  return (
    <Table
      pagination={{
        total: ielts?.meta?.total || 0,
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
          <h2>IELTS Testlar</h2>
          <IeltsModal />
        </div>
      )}
      size="small"
      loading={isIeltsLoading}
      scroll={{ x: "max-content" }}
      dataSource={tableData}
      rowKey={(rec) => rec.id || ""}
      onRow={(record) => ({
        onClick: (e) => {
          if (!(e.target instanceof HTMLButtonElement)) {
            navigate(`/ielts/${record.id}`);
          }
        },
      })}
      columns={IeltsColumns({
        onEdit: onOpen,
        onDelete: handleDelete,
        onCopyId: handleCopyId,
        navigate,
      })}
    />
  );
};
