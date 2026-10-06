import ContentAccessControls from "@/components/access/ContentAccessControls";
import { ConfigProvider, Modal, notification, Table } from "antd";
import trTR from "antd/locale/tr_TR";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useDeleteListeningTest } from "@/config/queries/listening/delete.queries";
import { useGetAllListeningTests } from "@/config/queries/listening/get-all.queries";
import {
  useMoveMockTestToDraft,
  usePublishMockTest,
} from "@/config/queries/test/publication.queries";
import { ExamListHeader } from "@/shared/components/exam-list-ui";

import { ListeningColumns } from "./ui/listening-columns";
import { ListeningModal } from "./ui/listening-modal";
import { useListeningModalStore } from "./utils/listening-modal-store";

export const ListeningTable = () => {
  const navigate = useNavigate();
  const { onOpen } = useListeningModalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const { data: listeningTests, isLoading: isListeningLoading } =
    useGetAllListeningTests();
  const { mutate: deleteListeningMutation } = useDeleteListeningTest();
  const { mutate: publishMockTest } = usePublishMockTest();
  const { mutate: moveMockTestToDraft } = useMoveMockTestToDraft();

  const tableData = listeningTests?.data || [];
  const total =
    listeningTests?.meta?.total ||
    (listeningTests as { total?: number } | undefined)?.total ||
    0;

  const handleSearch = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set("search", value);
    else nextParams.delete("search");
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    notification.success({
      message: "ID kopyalandı",
      placement: "bottomRight",
    });
  };

  return (
    <ConfigProvider locale={trTR}>
      <Table
        className="exam-list-table"
        columns={[...ListeningColumns({
          onEdit: onOpen,
          onDelete: (testId) => {
            setDeleteId(testId);
            setDeleteModalOpen(true);
          },
          onCopyId: handleCopyId,
          onPublish: publishMockTest,
          onMoveToDraft: moveMockTestToDraft,
        }),{title:"Erişim",render:(_,row)=><ContentAccessControls target={{scope:"MOCK_LISTENING",targetId:row.id}} row={row}/>}]}
        dataSource={tableData}
        loading={isListeningLoading}
        pagination={{
          total,
          pageSize,
          current: currentPage,
          hideOnSinglePage: total <= pageSize,
          showSizeChanger: total > 10,
          pageSizeOptions: [10, 20, 50],
          showTotal: (count) => `${count} test`,
          onChange: (page, size) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("page", page.toString());
            nextParams.set("limit", size?.toString() || "10");
            setSearchParams(nextParams);
          },
        }}
        rowKey={(record) => record.id || ""}
        scroll={{ x: 600 }}
        size="small"
        title={() => (
          <ExamListHeader
            title="Dinleme testleri"
            action={<ListeningModal />}
            searchValue={searchParams.get("search") || ""}
            onSearch={handleSearch}
          />
        )}
        onRow={(record) => ({
          className:
            record.isDeleted || searchParams.get("view") === "ARCHIVED"
              ? ""
              : "exam-list-clickable-row",
          onClick: () => {
            if (
              record.id &&
              !record.isDeleted &&
              searchParams.get("view") !== "ARCHIVED"
            )
              navigate(`/listening/${record.id}/edit-v3`);
          },
        })}
      />

      <Modal
        title="Dinleme testini arşivle"
        open={deleteModalOpen}
        onOk={() => {
          deleteListeningMutation(deleteId);
          setDeleteModalOpen(false);
          setDeleteId("");
        }}
        onCancel={() => setDeleteModalOpen(false)}
        okText="Arşivle"
        cancelText="Vazgeç"
        okButtonProps={{ danger: true }}
      >
        <p>Bu dinleme testini arşivlemek istediğinizden emin misiniz?</p>
      </Modal>
    </ConfigProvider>
  );
};
