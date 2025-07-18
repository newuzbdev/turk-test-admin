import { Table, Modal, notification } from "antd";
import { useWritingModalStore } from "./utils/writing-modal-store";
import { WritingModal } from "./ui/writing-modal";
import { useState } from "react";
import { WritingColumns } from "./ui/writing-columns";
import { useGetAllWritingTests } from "@/config/queries/writing/get-all.queries";
import { useDeleteWritingTest } from "@/config/queries/writing/delete.queries";
import { useSearchParams } from "react-router-dom";

export const WritingTable = () => {
  const { onOpen } = useWritingModalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const { data: writingTests, isLoading: isWritingLoading } =
    useGetAllWritingTests();
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
          total: writingTests?.meta?.total || (writingTests as any)?.total || 0,
          pageSize: pageSize,
          current: currentPage,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50, 100],
          onChange: (page, size) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("page", page.toString());
            newParams.set("limit", size?.toString() || "10");
            setSearchParams(newParams);
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
