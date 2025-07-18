import { Table, Modal, notification } from "antd";
import { useListeningModalStore } from "./utils/listening-modal-store";
import { ListeningModal } from "./ui/listening-modal";
import { useState } from "react";
import { ListeningColumns } from "./ui/listening-columns";
import { useGetAllListeningTests } from "@/config/queries/listening/get-all.queries";
import { useDeleteListeningTest } from "@/config/queries/listening/delete.queries";
import { useSearchParams } from "react-router-dom";

export const ListeningTable = () => {
  const { onOpen } = useListeningModalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const { data: listeningTests, isLoading: isListeningLoading } =
    useGetAllListeningTests();
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
          total:
            listeningTests?.meta?.total || (listeningTests as any)?.total || 0,
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
