import ContentAccessControls from "@/components/access/ContentAccessControls";
import { Button, ConfigProvider, message, Modal, Result, Table } from "antd";
import trTR from "antd/locale/tr_TR";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useGetAllSpeakingTests } from "@/config/queries/speaking/get-all.queries";
import {
  useArchiveSpeakingV2,
  useDeleteSpeakingV2,
  useReviseSpeakingV2,
} from "@/config/queries/speaking/v2.queries";
import { ExamListHeader } from "@/shared/components/exam-list-ui";
import type { SpeakingListRow } from "@/pages/speaking-v2/types";

import { SpeakingColumns } from "./ui/speaking-columns";
import { SpeakingModal } from "./ui/speaking-modal";

export const SpeakingTable = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isError, refetch } = useGetAllSpeakingTests();
  const revise = useReviseSpeakingV2();
  const archive = useArchiveSpeakingV2();
  const remove = useDeleteSpeakingV2();
  const revisionInFlightRef = useRef(false);
  const [revisionPending, setRevisionPending] = useState(false);

  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Number.parseInt(searchParams.get("limit") || "10", 10);
  const total = data?.meta.total ?? 0;

  const columns = SpeakingColumns({
    revisionPending,
    onOpen: (id) => navigate(`/speaking/${id}/edit`),
    onEdit: (id) => navigate(`/speaking/${id}/edit`),
    onDelete: (id) =>
      Modal.confirm({
        title: "Taslağı sil",
        content: "Bu taslak kalıcı olarak silinecek.",
        okText: "Sil",
        okButtonProps: { danger: true },
        cancelText: "Vazgeç",
        onOk: async () => {
          try {
            await remove.mutateAsync(id);
            message.success("Taslak silindi.");
          } catch {
            message.error("Taslak silinemedi. Yeniden deneyin.");
            throw new Error("delete failed");
          }
        },
      }),
    onRevise: async (id) => {
      if (revisionInFlightRef.current) return;
      revisionInFlightRef.current = true;
      setRevisionPending(true);
      try {
        const created = await revise.mutateAsync(id);
        navigate(`/speaking/${created.id}/edit`);
      } catch {
        message.error("Yeni sürüm oluşturulamadı. Yeniden deneyin.");
      } finally {
        revisionInFlightRef.current = false;
        setRevisionPending(false);
      }
    },
    onArchive: (id) =>
      Modal.confirm({
        title: "Testi arşivle",
        content:
          "Yeni öğrenciler bu testi başlatamayacak. Geçmiş sonuçlar korunacak.",
        okText: "Arşivle",
        cancelText: "Vazgeç",
        onOk: async () => {
          try {
            await archive.mutateAsync(id);
            message.success("Test arşivlendi.");
          } catch {
            message.error("Test arşivlenemedi. Yeniden deneyin.");
            throw new Error("archive failed");
          }
        },
      }),
  });

  return (
    <ConfigProvider locale={trTR}>
      {isError ? (
        <Result
          status="error"
          title="Konuşma testleri yüklenemedi"
          extra={<Button onClick={() => void refetch()}>Yeniden dene</Button>}
        />
      ) : (
        <Table<SpeakingListRow>
          className="exam-list-table"
          columns={[...columns,{title:"Erişim",render:(_,row)=><ContentAccessControls target={{scope:"MOCK_SPEAKING",targetId:row.id}} row={row}/>}]}
          dataSource={data?.data ?? []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 600 }}
          size="small"
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
              nextParams.set("page", String(page));
              nextParams.set("limit", String(size ?? 10));
              setSearchParams(nextParams);
            },
          }}
          title={() => (
            <ExamListHeader
              title="Konuşma testleri"
              action={<SpeakingModal />}
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
        />
      )}
    </ConfigProvider>
  );
};
