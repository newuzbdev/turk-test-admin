import { Table, Modal, notification } from "antd";
import { useState } from "react";
import { ArchiveColumns } from "./ui/archive-columns";
import { useGetAllArchivedTests } from "@/config/queries/archive/get-all.queries";
import { useRestoreTest } from "@/config/queries/archive/restore.queries";
import { useSearchParams } from "react-router-dom";

export const ArchiveTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const { data: archivedTests, isLoading: isArchiveLoading } =
    useGetAllArchivedTests();
  const { mutate: restoreTestMutation } = useRestoreTest();

  const handleRestore = (testId: string) => {
    setRestoreId(testId);
    setRestoreModalOpen(true);
  };

  const confirmRestore = () => {
    restoreTestMutation(restoreId);
    setRestoreModalOpen(false);
    setRestoreId("");
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    notification.success({
      message: "ID nusxalandi",
      description: "Test ID muvaffaqiyatli nusxalandi",
    });
  };

  const tableData = archivedTests?.data?.map((test, index) => ({
    ...test,
    key: test.id || index,
    index: (currentPage - 1) * pageSize + index + 1,
  })) || [];

  return (
    <>
      <Table
        pagination={{
          total: archivedTests?.meta?.total || (archivedTests as any)?.total || 0,
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
            <h2>Arxivlangan Testlar</h2>
          </div>
        )}
        size="small"
        loading={isArchiveLoading}
        scroll={{ x: "max-content" }}
        dataSource={tableData}
        rowKey={(rec) => rec.id || ""}
        columns={ArchiveColumns({
          onRestore: handleRestore,
          onCopyId: handleCopyId,
        })}
      />

      <Modal
        title="Testni qayta tiklash"
        open={restoreModalOpen}
        onOk={confirmRestore}
        onCancel={() => setRestoreModalOpen(false)}
        okText="Qayta tiklash"
        cancelText="Bekor qilish"
      >
        <p>Ushbu testni qayta tiklashni xohlaysizmi?</p>
      </Modal>
    </>
  );
};
