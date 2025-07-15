import { Table, Modal } from "antd";
import { useIeltsModalStore } from "./utils/ielts-modal-store";
import { IeltsModal } from "./ui/ielts-modal";
import { useState } from "react";
import { IeltsColumns } from "./ui/ielts-columns";
import { useDeleteIelts, useGetAllIelts } from "@/config/queries";

export const IeltsTable = () => {
  const { onOpen } = useIeltsModalStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const { data: ielts, isLoading: isIeltsLoading } = useGetAllIelts();
  const { mutate: deleteIeltsMutation } = useDeleteIelts();

  const handleDelete = (ieltsId: string) => {
    setDeleteId(ieltsId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteIeltsMutation(deleteId);
    setDeleteModalOpen(false);
    setDeleteId("");
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const tableData = ielts?.data || [];

  return (
    <>
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
        columns={IeltsColumns({
          onEdit: onOpen,
          onDelete: handleDelete,
          onCopyId: handleCopyId,
        })}
      />

      <Modal
        title="Ishonchingiz komilmi?"
        open={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        okText="Ha"
        cancelText="Yo'q"
      >
        <p>Ushbu IELTS testini o'chirishni xoxlaysizmi?</p>
      </Modal>
    </>
  );
};
