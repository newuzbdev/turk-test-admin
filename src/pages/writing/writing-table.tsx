import { Table, Modal, notification } from "antd";
import { useWritingModalStore } from "./utils/writing-modal-store";
import { WritingModal } from "./ui/writing-modal";
import { useState } from "react";
import { WritingColumns } from "./ui/writing-columns";
import { useGetAllWritingTests } from "@/config/queries/writing/get-all.queries";
import { useDeleteWritingTest } from "@/config/queries/writing/delete.queries";

export const WritingTable = () => {
  const { onOpen } = useWritingModalStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const { data: writingTests, isLoading: isWritingLoading } = useGetAllWritingTests();
  const { mutate: deleteWritingMutation } = useDeleteWritingTest();

  const handleDelete = (testId: string) => {
    setDeleteId(testId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteWritingMutation(deleteId);
    setDeleteModalOpen(false);
    setDeleteId("");
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    notification.success({
      message: "ID nusxalandi",
      placement: "bottomRight",
    });
  };

  const tableData = writingTests?.data || [];

  return (
    <>
      <Table
        pagination={{
          total: writingTests?.meta?.total || 0,
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
            <h2>Writing Testlar</h2>
            <WritingModal />
          </div>
        )}
        size="small"
        loading={isWritingLoading}
        scroll={{ x: "max-content" }}
        dataSource={tableData}
        rowKey={(rec) => rec.id || ""}
        columns={WritingColumns({
          onEdit: onOpen,
          onDelete: handleDelete,
          onCopyId: handleCopyId,
        })}
      />

      <Modal
        title="Writing testini o'chirish"
        open={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        okText="O'chirish"
        cancelText="Bekor qilish"
        okButtonProps={{ danger: true }}
      >
        <p>Haqiqatan ham bu writing testini o'chirmoqchimisiz?</p>
      </Modal>
    </>
  );
};
