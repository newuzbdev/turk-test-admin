import { Table, Modal, notification, Tabs } from "antd";
import {
  useTestModalStore,
  useOnlyTestModalStore,
} from "./utils/test-modal-store";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  useDeleteOnlyTest,
  useDeleteTest,
} from "../../config/queries/test/delete.queries";
import {
  useGetAllOnlyTest,
  useGetAllTestWithAddition,
} from "../../config/queries/test/get-all.queries";
import { OnlyTestModal } from "./ui/only-test-modal";
import { OnlyTestColumns } from "./ui/only-test-columns";
import { TestModal } from "./ui/test-modal";
import { TestColumns } from "./ui/test-columns";

export const TestTable = () => {
  const { onOpen: onOpenTest } = useTestModalStore();
  const { onOpen: onOpenOnlyTest } = useOnlyTestModalStore();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("with-addition");

  const { data: testsWithAddition, isLoading: isTestsLoading } =
    useGetAllTestWithAddition();
  const { data: onlyTests, isLoading: isOnlyTestsLoading } =
    useGetAllOnlyTest();
  const deleteTest = useDeleteTest();
  const deleteOnlyTest = useDeleteOnlyTest();

  const handleDeleteTest = (testId: string) => {
    Modal.confirm({
      title: "Ishonchingiz komilmi?",
      content: "Ushbu testni o'chirishni xoxlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      onOk: () => {
        deleteTest.mutateAsync(testId);
      },
    });
  };

  const handleDeleteOnlyTest = (testId: string) => {
    Modal.confirm({
      title: "Ishonchingiz komilmi?",
      content: "Ushbu testni o'chirishni xoxlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      onOk: () => {
        deleteOnlyTest.mutateAsync(testId);
      },
    });
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(id);
      notification.success({
        message: "Muvaffaqiyatli nusxa ko`chirildi",
      });
    } catch {
      notification.error({
        message: "Nusxa ko`chirishda xatolik yuz berdi",
      });
    }
  };

  const testsWithAdditionData = testsWithAddition?.data || [];
  const onlyTestsData = onlyTests?.data || [];

  const tabItems = [
    {
      key: "with-addition",
      label: "Qo'shimcha ma'lumotlar bilan",
      children: (
        <Table
          pagination={{
            total: testsWithAddition?.meta?.total || 0,
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
              <h3>Testlar (Qo'shimcha ma'lumotlar bilan)</h3>
              <TestModal />
            </div>
          )}
          size="small"
          loading={isTestsLoading}
          scroll={{ x: "max-content" }}
          dataSource={testsWithAdditionData}
          rowKey={(rec) => rec.id || ""}
          onRow={(record) => ({
            onClick: (e) => {
              if (!(e.target instanceof HTMLButtonElement)) {
                navigate(`/test/${record.id}`);
              }
            },
          })}
          columns={TestColumns({
            onEdit: onOpenTest,
            onDelete: handleDeleteTest,
            onCopyId: handleCopyId,
            navigate,
          })}
        />
      ),
    },
    {
      key: "only",
      label: "Faqat test",
      children: (
        <Table
          pagination={{
            total: onlyTests?.meta?.total || 0,
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
              <h3>Testlar (Faqat test)</h3>
              <OnlyTestModal />
            </div>
          )}
          size="small"
          loading={isOnlyTestsLoading}
          scroll={{ x: "max-content" }}
          dataSource={onlyTestsData}
          rowKey={(rec) => rec.id || ""}
          onRow={(record) => ({
            onClick: (e) => {
              if (!(e.target instanceof HTMLButtonElement)) {
                navigate(`/test/only/${record.id}`);
              }
            },
          })}
          columns={OnlyTestColumns({
            onEdit: onOpenOnlyTest,
            onDelete: handleDeleteOnlyTest,
            onCopyId: handleCopyId,
            navigate,
          })}
        />
      ),
    },
  ];

  return (
    <div>
      <h2 className="mb-4">Testlar</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
};
