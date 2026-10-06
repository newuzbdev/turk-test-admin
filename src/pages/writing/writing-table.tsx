import ContentAccessControls from "@/components/access/ContentAccessControls";
import { ConfigProvider, Modal, notification, Table } from "antd";
import trTR from "antd/locale/tr_TR";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useArchiveWritingTestV2 } from "@/config/queries/writing/v2.queries";
import { useGetAllWritingTests } from "@/config/queries/writing/get-all.queries";
import { ExamListHeader } from "@/shared/components/exam-list-ui";

import { WritingColumns } from "./ui/writing-columns";
import { WritingModal } from "./ui/writing-modal";

export const WritingTable = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveId, setArchiveId] = useState("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const { data: writingTests, isLoading: isWritingLoading } =
    useGetAllWritingTests();
  const { mutate: archiveWritingMutation, isPending: isArchiving } =
    useArchiveWritingTestV2();

  const tableData = writingTests?.data || [];
  const total =
    writingTests?.meta?.total ||
    (writingTests as { total?: number } | undefined)?.total ||
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
        columns={[...WritingColumns({
          onArchive: (testId) => {
            setArchiveId(testId);
            setArchiveModalOpen(true);
          },
          onCopyId: handleCopyId,
        }),{title:"Erişim",render:(_,row)=><ContentAccessControls target={{scope:"MOCK_WRITING",targetId:row.id}} row={row}/>}]}
        dataSource={tableData}
        loading={isWritingLoading}
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
            title="Yazma testleri"
            action={<WritingModal />}
            searchValue={searchParams.get("search") || ""}
            onSearch={handleSearch}
          />
        )}
        onRow={(record) => ({
          className:
            record.formatVersion === 2 && !record.isDeleted
              ? "exam-list-clickable-row"
              : "",
          onClick: () => {
            if (record.id && record.formatVersion === 2 && !record.isDeleted) {
              navigate(`/writing/${record.id}/edit-v2`);
            }
          },
        })}
      />

      <Modal
        title="Yazma testini arşivle"
        open={archiveModalOpen}
        onOk={() => {
          archiveWritingMutation(archiveId, {
            onSuccess: () => {
              setArchiveModalOpen(false);
              setArchiveId("");
            },
          });
        }}
        onCancel={() => setArchiveModalOpen(false)}
        okText="Arşivle"
        cancelText="Vazgeç"
        confirmLoading={isArchiving}
        okButtonProps={{ danger: true }}
      >
        <p>
          Bu test yeni öğrencilere sunulmayacak. Geçmiş öğrenci sonuçları
          silinmeyecek.
        </p>
      </Modal>
    </ConfigProvider>
  );
};
