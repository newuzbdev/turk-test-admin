import ContentAccessControls from "@/components/access/ContentAccessControls";
import { ConfigProvider, Modal, notification, Table } from "antd";
import trTR from "antd/locale/tr_TR";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useDeleteReadingTest } from "@/config/queries/reading/delete.queries";
import { useGetAllReadingTests } from "@/config/queries/reading/get-all.queries";
import {
  useMoveMockTestToDraft,
  usePublishMockTest,
} from "@/config/queries/test/publication.queries";
import { ExamListHeader } from "@/shared/components/exam-list-ui";

import { ReadingColumns } from "./ui/reading-columns";
import { ReadingModal } from "./ui/reading-modal";
import { useReadingModalStore } from "./utils/reading-modal-store";

export const ReadingTable = () => {
  const navigate = useNavigate();
  const { onOpen } = useReadingModalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const { data: readingTests, isLoading: isReadingLoading } =
    useGetAllReadingTests();
  const { mutate: deleteReadingMutation } = useDeleteReadingTest();
  const { mutate: publishMockTest } = usePublishMockTest();
  const { mutate: moveMockTestToDraft } = useMoveMockTestToDraft();

  const tableData = readingTests?.data || [];
  const total = readingTests?.meta?.total ?? readingTests?.total ?? 0;

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
        columns={[...ReadingColumns({
          onEdit: onOpen,
          onDelete: (testId) => {
            setDeleteId(testId);
            setDeleteModalOpen(true);
          },
          onCopyId: handleCopyId,
          onPublish: publishMockTest,
          onMoveToDraft: moveMockTestToDraft,
        }),{title:"Erişim",render:(_,row)=><ContentAccessControls target={{scope:"MOCK_READING",targetId:row.id}} row={row}/>}]}
        dataSource={tableData}
        loading={isReadingLoading}
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
            title="Okuma testleri"
            action={<ReadingModal />}
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
              navigate(`/reading/${record.id}/edit-v3`);
          },
        })}
      />

      <Modal
        title="Okuma testini arşivle"
        open={deleteModalOpen}
        onOk={() => {
          deleteReadingMutation(deleteId);
          setDeleteModalOpen(false);
          setDeleteId("");
        }}
        onCancel={() => setDeleteModalOpen(false)}
        okText="Arşivle"
        cancelText="Vazgeç"
        okButtonProps={{ danger: true }}
      >
        <p>Bu okuma testini arşivlemek istediğinizden emin misiniz?</p>
      </Modal>
    </ConfigProvider>
  );
};
