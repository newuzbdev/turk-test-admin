import { Table, Modal, notification } from "antd";
import { useState } from "react";
import { ArchiveColumns } from "./ui/archive-columns";
import { useGetAllArchivedTests } from "@/config/queries/archive/get-all.queries";
import { useRestoreTest } from "@/config/queries/archive/restore.queries";
import { useSearchParams } from "react-router-dom";
import { Archive as ArchiveIcon } from "lucide-react";

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

  // Handle different data structures from the API
  const getTableData = () => {
    if (!archivedTests) return [];

    // Check if data is in the expected format
    if (archivedTests.data && Array.isArray(archivedTests.data)) {
      return archivedTests.data.map((test, index) => ({
        ...test,
        key: test.id || index,
        index: (currentPage - 1) * pageSize + index + 1,
      }));
    }

    // Handle the case where data is directly in the response
    if (Array.isArray(archivedTests)) {
      return archivedTests.map((test, index) => ({
        ...test,
        key: test.id || index,
        index: (currentPage - 1) * pageSize + index + 1,
      }));
    }

    // Handle the case where data is nested in different properties
    const allTests = [];
    if (archivedTests.ielts && Array.isArray(archivedTests.ielts)) {
      allTests.push(
        ...archivedTests.ielts.map((test) => ({ ...test, type: "IELTS" }))
      );
    }
    if (
      archivedTests.listeningTest &&
      Array.isArray(archivedTests.listeningTest)
    ) {
      allTests.push(
        ...archivedTests.listeningTest.map((test) => ({
          ...test,
          type: "LISTENING",
        }))
      );
    }
    if (archivedTests.readingTest && Array.isArray(archivedTests.readingTest)) {
      allTests.push(
        ...archivedTests.readingTest.map((test) => ({
          ...test,
          type: "READING",
        }))
      );
    }
    if (
      archivedTests.speakingTest &&
      Array.isArray(archivedTests.speakingTest)
    ) {
      allTests.push(
        ...archivedTests.speakingTest.map((test) => ({
          ...test,
          type: "SPEAKING",
        }))
      );
    }
    if (archivedTests.writingTest && Array.isArray(archivedTests.writingTest)) {
      allTests.push(
        ...archivedTests.writingTest.map((test) => ({
          ...test,
          type: "WRITING",
        }))
      );
    }

    return allTests.map((test, index) => ({
      ...test,
      key: test.id || index,
      index: (currentPage - 1) * pageSize + index + 1,
    }));
  };

  const tableData = getTableData();

  // Debug information (remove in production)
  console.log("Archive data structure:", archivedTests);
  console.log("Processed table data:", tableData);

  return (
    <>
      <Table
        pagination={{
          total:
            archivedTests?.meta?.total ||
            (archivedTests as { total?: number })?.total ||
            (Array.isArray(archivedTests?.ielts)
              ? archivedTests.ielts.length
              : 0) +
              (Array.isArray(archivedTests?.listeningTest)
                ? archivedTests.listeningTest.length
                : 0) +
              (Array.isArray(archivedTests?.readingTest)
                ? archivedTests.readingTest.length
                : 0) +
              (Array.isArray(archivedTests?.speakingTest)
                ? archivedTests.speakingTest.length
                : 0) +
              (Array.isArray(archivedTests?.writingTest)
                ? archivedTests.writingTest.length
                : 0) ||
            0,
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
            <div className="text-sm text-gray-500">
              Jami: {tableData.length} ta test
            </div>
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
        locale={{
          emptyText: (
            <div className="py-8 text-center">
              <ArchiveIcon className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500 mb-2">Arxivda test mavjud emas</p>
              <p className="text-sm text-gray-400">
                O'chirilgan testlar bu yerda ko'rsatiladi
              </p>
            </div>
          ),
        }}
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
