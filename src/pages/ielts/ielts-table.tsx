import { Table, Modal } from "antd";
import { useIeltsModalStore } from "./utils/ielts-modal-store";
import { IeltsModal } from "./ui/ielts-modal";
import { useState } from "react";
import { IeltsColumns } from "./ui/ielts-columns";
import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";
import { useDeleteIelts } from "@/config/queries/ielts/delete.queries";
import { useSearchParams } from "react-router-dom";

export const IeltsTable = () => {
  const { onOpen } = useIeltsModalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

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

  const tableData = ielts?.ieltsData || [];

  return (
    <>
      <Table
        pagination={{
          total: ielts?.total || 0,
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
