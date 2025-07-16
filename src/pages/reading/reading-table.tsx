import { Table, Modal, notification } from "antd";
import { useReadingModalStore } from "./utils/reading-modal-store";
import { ReadingModal } from "./ui/reading-modal";
import { useState } from "react";
import { ReadingColumns } from "./ui/reading-columns";
import { useGetAllReadingTests } from "@/config/queries/reading/get-all.queries";
import { useDeleteReadingTest } from "@/config/queries/reading/delete.queries";

export const ReadingTable = () => {
  const { onOpen } = useReadingModalStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const { data: readingTests, isLoading: isReadingLoading } = useGetAllReadingTests();
  const { mutate: deleteReadingMutation } = useDeleteReadingTest();

  const handleDelete = (testId: string) => {
    setDeleteId(testId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteReadingMutation(deleteId);
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

  const tableData = readingTests?.data || [];

  return (
    <>
      <Table
        pagination={{
          total: readingTests?.meta?.total || 0,
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
            <h2>Reading Testlar</h2>
            <ReadingModal />
          </div>
        )}
        size="small"
        loading={isReadingLoading}
        scroll={{ x: "max-content" }}
        dataSource={tableData}
        rowKey={(rec) => rec.id || ""}
        columns={ReadingColumns({
          onEdit: onOpen,
          onDelete: handleDelete,
          onCopyId: handleCopyId,
        })}
      />

      <Modal
        title="Reading testini o'chirish"
        open={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        okText="O'chirish"
        cancelText="Bekor qilish"
        okButtonProps={{ danger: true }}
      >
        <p>Haqiqatan ham bu reading testini o'chirmoqchimisiz?</p>
      </Modal>
    </>
  );
};
