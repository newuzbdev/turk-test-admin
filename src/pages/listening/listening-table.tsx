import { Table, Modal, notification } from "antd";
import { useListeningModalStore } from "./utils/listening-modal-store";
import { ListeningModal } from "./ui/listening-modal";
import { useState } from "react";
import { ListeningColumns } from "./ui/listening-columns";
import { useGetAllListeningTests } from "@/config/queries/listening/get-all.queries";
import { useDeleteListeningTest } from "@/config/queries/listening/delete.queries";

export const ListeningTable = () => {
  const { onOpen } = useListeningModalStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const { data: listeningTests, isLoading: isListeningLoading } = useGetAllListeningTests();
  const { mutate: deleteListeningMutation } = useDeleteListeningTest();

  const handleDelete = (testId: string) => {
    setDeleteId(testId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteListeningMutation(deleteId);
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

  const tableData = listeningTests?.data || [];

  return (
    <>
      <Table
        pagination={{
          total: listeningTests?.meta?.total || 0,
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
            <h2>Listening Testlar</h2>
            <ListeningModal />
          </div>
        )}
        size="small"
        loading={isListeningLoading}
        scroll={{ x: "max-content" }}
        dataSource={tableData}
        rowKey={(rec) => rec.id || ""}
        columns={ListeningColumns({
          onEdit: onOpen,
          onDelete: handleDelete,
          onCopyId: handleCopyId,
        })}
      />

      <Modal
        title="Listening testini o'chirish"
        open={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        okText="O'chirish"
        cancelText="Bekor qilish"
        okButtonProps={{ danger: true }}
      >
        <p>Haqiqatan ham bu listening testini o'chirmoqchimisiz?</p>
      </Modal>
    </>
  );
};
