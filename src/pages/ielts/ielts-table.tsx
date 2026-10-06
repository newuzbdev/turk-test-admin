import { ExamListHeader } from "@/shared/components/exam-list-ui";
import { Alert, notification } from "antd";
import { Table, Modal } from "antd";
import { useIeltsModalStore } from "./utils/ielts-modal-store";
import { IeltsModal } from "./ui/ielts-modal";
import { useState } from "react";
import { IeltsColumns } from "./ui/ielts-columns";
import { useAdminIeltsList } from "@/config/queries/ielts/get-all.queries";
import { useDeleteIelts } from "@/config/queries/ielts/delete.queries";
import { useSearchParams } from "react-router-dom";

export const IeltsTable = () => {
  const { onOpen } = useIeltsModalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const {
    data: ielts,
    isLoading: isIeltsLoading,
    isError,
    refetch,
  } = useAdminIeltsList();
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
    navigator.clipboard
      .writeText(id)
      .then(() => notification.success({ message: "ID kopyalandı" }));
  };

  const tableData = ielts?.ieltsData || [];

  return (
    <>
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Testler yüklenemedi"
          action={<button onClick={() => refetch()}>Yeniden dene</button>}
        />
      )}
      <Table
        className="exam-list-table"
        locale={{
          emptyText: searchParams.get("search")
            ? "Aramana uygun deneme yok."
            : "Bu listede deneme yok.",
        }}
        pagination={{
          total: ielts?.total || 0,
          pageSize: pageSize,
          current: currentPage,
          showSizeChanger: (ielts?.total || 0) > 10,
          hideOnSinglePage: true,
          showTotal: (total) => `${total} deneme`,
          pageSizeOptions: [10, 20, 50],
          onChange: (page, size) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("page", page.toString());
            newParams.set("limit", size?.toString() || "10");
            setSearchParams(newParams);
          },
        }}
        title={() => (
          <ExamListHeader
            title="Tam denemeler"
            action={
              <IeltsModal
                onCreated={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set("view", "DRAFT");
                  next.set("page", "1");
                  next.delete("search");
                  setSearchParams(next);
                }}
              />
            }
            searchValue={searchParams.get("search") || ""}
            onSearch={(value) => {
              const next = new URLSearchParams(searchParams);
              if (value) next.set("search", value);
              else next.delete("search");
              next.set("page", "1");
              setSearchParams(next);
            }}
          />
        )}
        size="small"
        loading={isIeltsLoading}
        scroll={{ x: 560 }}
        dataSource={tableData}
        rowKey={(rec) => rec.id || ""}
        columns={IeltsColumns({
          onEdit: onOpen,
          onDelete: handleDelete,
          onCopyId: handleCopyId,
          onAccessChanged:()=>void refetch(),
        })}
      />

      <Modal
        title="Denemeyi arşivle"
        open={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        okText="Arşivle"
        cancelText="Vazgeç"
        okButtonProps={{ danger: true }}
      >
        <p>
          Bu deneme yayındaki listeden kaldırılıp arşive taşınacak. Mevcut
          sonuçlar korunur.
        </p>
      </Modal>
    </>
  );
};
