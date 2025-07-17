import { Table, Modal, notification } from "antd";
import { useSpeakingModalStore } from "./utils/speaking-modal-store";
import { SpeakingModal } from "./ui/speaking-modal";
import { useState } from "react";
import { SpeakingColumns } from "./ui/speaking-columns";
import { useGetAllSpeakingTests } from "@/config/queries/speaking/get-all.queries";
import { useDeleteSpeakingTest } from "@/config/queries/speaking/delete.queries";
import type { SpeakingTest } from "@/utils/types/types";

export const SpeakingTable = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data, isLoading } = useGetAllSpeakingTests();
  const { mutate: deleteSpeakingTest } = useDeleteSpeakingTest();
  const { onOpen } = useSpeakingModalStore();

  const handleEdit = (record: SpeakingTest) => {
    onOpen(record);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Speaking testni o'chirish",
      content: "Haqiqatan ham bu speaking testni o'chirmoqchimisiz?",
      okText: "Ha, o'chirish",
      cancelText: "Bekor qilish",
      okType: "danger",
      onOk: () => {
        deleteSpeakingTest(id);
      },
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    notification.success({
      message: "ID nusxalandi",
      placement: "bottomRight",
    });
  };

  const columns = SpeakingColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCopyId: handleCopyId,
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Speaking Tests</h1>
          <p className="text-gray-600 mt-1">
            Speaking testlarini boshqaring va tahrirlang
          </p>
        </div>
        <SpeakingModal />
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          total: data?.meta?.total || 0,
          pageSize: data?.meta?.limit || 10,
          current: data?.meta?.page || 1,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: 800 }}
      />
    </div>
  );
};
