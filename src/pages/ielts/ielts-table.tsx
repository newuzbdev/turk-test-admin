import { Table, Modal } from "antd";
import { useIeltsModalStore } from "./utils/ielts-modal-store";
import { useState } from "react";
import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";
import { useDeleteIelts } from "@/config/queries/ielts/delete.queries";
import { useSearchParams } from "react-router-dom";

export const IeltsTable = () => {
  const { onOpen } = useIeltsModalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || "10");

  const { data: ielts, isLoading: isIeltsLoading } = useGetAllIelts();
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
    navigator.clipboard.writeText(id);
  };

<<<<<<< HEAD
  // Extract ieltsData
  const tableData = ielts?.ieltsData || [];

  // Define table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <>
          <button onClick={() => onOpen(record.id)}>Edit</button>
          <button onClick={() => handleDelete(record.id)}>Delete</button>
          <button onClick={() => handleCopyId(record.id)}>Copy ID</button>
        </>
      ),
    },
  ];
=======
  const tableData = ielts?.ieltsData || [];
>>>>>>> 7e0758a70e6f09c9d4c277c95df1b76ab4c626f0

  return (
    <>
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={isIeltsLoading}
        pagination={{
          total: ielts?.total || 0,
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
      />
      <Modal
        title="Confirm Delete"
        visible={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      >
        Are you sure you want to delete this item?
      </Modal>
    </>
  );
};
