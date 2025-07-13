import { Table, Modal, notification } from "antd";
import { useListeningModalStore } from "./utils/listening-modal-store";
import { ListeningModal } from "./ui/listening-modal";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ListeningColumns } from "./ui/listening-columns";
import { useDeleteListeningTest } from "@/config/queries/listening/delete.queries";
import { useGetAllListeningTests } from "@/config/queries/listening/get-all.queries";

export const ListeningTable = () => {
  const { onOpen } = useListeningModalStore();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: tests, isLoading: isTestsLoading } = useGetAllListeningTests();
  const deleteTest = useDeleteListeningTest();

  const handleDelete = (testId: string) => {
    Modal.confirm({
      title: "Ishonchingiz komilmi?",
      content: "Ushbu Listening testini o'chirishni xoxlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      onOk: () => {
        deleteTest.mutateAsync(testId);
      },
    });
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    notification.success({
      message: "ID nusxalandi",
      placement: "bottomRight",
    });
  };

  const tableData = tests?.data || [];

  return (
    <Table
      pagination={{
        total: tests?.meta?.total || 0,
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
      loading={isTestsLoading}
      scroll={{ x: "max-content" }}
      dataSource={tableData}
      rowKey={(rec) => rec.id || ""}
      onRow={(record) => ({
        onClick: (e) => {
          if (!(e.target instanceof HTMLButtonElement)) {
            navigate(`/listening/${record.id}`);
          }
        },
      })}
      columns={ListeningColumns({
        onEdit: onOpen,
        onDelete: handleDelete,
        onCopyId: handleCopyId,
        navigate,
      })}
    />
  );
};
