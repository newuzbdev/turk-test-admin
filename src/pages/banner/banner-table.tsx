import React, { useState } from "react";
import { Table, Card, Button, Space, Input, Select, message } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useGetAllBanners, useDeleteBanner } from "@/config/queries/banner";
import { createBannerColumns } from "./ui/banner-columns";
import BannerModal from "./ui/banner-modal";
import type { Banner } from "@/utils/types/types";

const { Search } = Input;
const { Option } = Select;

export default function BannerTable() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const { data: bannersResponse, isLoading, refetch, error } = useGetAllBanners();
  const { mutate: deleteBanner, isPending: isDeleting } = useDeleteBanner();

  // Handle different possible response structures
  const banners = Array.isArray(bannersResponse?.data) 
    ? bannersResponse.data 
    : Array.isArray(bannersResponse) 
    ? bannersResponse 
    : [];

  // Temporary mock data for testing
  const mockBanners = [
    {
      id: "1",
      name: "Summer Sale",
      title: "Test Banner 1",
      description: "Test description",
      imageUrl: "test-image.jpg",
      linkUrl: "https://example.com",
      isActive: true,
      order: 1,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    },
    {
      id: "2", 
      name: "Winter Sale",
      title: "Test Banner 2",
      description: "Another test description",
      imageUrl: "test-image2.jpg",
      linkUrl: "https://example2.com",
      isActive: false,
      order: 2,
      createdAt: "2024-01-02",
      updatedAt: "2024-01-02"
    }
  ];

  // Use mock data if no real data
  const displayBanners = banners.length > 0 ? banners : mockBanners;

  // Debug logging
  console.log("Banner data:", bannersResponse);
  console.log("Banners array:", banners);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

  // Filter banners based on search and status
  const filteredBanners = displayBanners.filter((banner: Banner) => {
    const matchesSearch = banner.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         (banner.description && banner.description.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && banner.isActive) ||
                         (statusFilter === "inactive" && !banner.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setModalMode("create");
    setSelectedBanner(null);
    setModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setModalMode("edit");
    setSelectedBanner(banner);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBanner(id, {
      onSuccess: () => {
        message.success("Banner o'chirildi");
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("O'chirish uchun banner tanlang");
      return;
    }
    // Implement bulk delete logic here
    message.info("Bulk delete functionality to be implemented");
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const bannerColumns = createBannerColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <h3>Xatolik yuz berdi</h3>
          <p>Bannerlarni yuklashda xatolik: {error.message}</p>
          <Button type="primary" onClick={() => refetch()}>
            Qayta urinish
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="Banner qidirish..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
          >
            <Option value="all">Barchasi</Option>
            <Option value="active">Faol</Option>
            <Option value="inactive">Nofaol</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Yangi Banner
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Yangilash
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={handleBulkDelete}
              loading={isDeleting}
            >
              Tanlanganlarni o'chirish ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={bannerColumns}
        dataSource={filteredBanners}
        rowKey="id"
        loading={isLoading}
        rowSelection={rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total} ta banner`,
        }}
        scroll={{ x: 800 }}
        locale={{
          emptyText: isLoading ? "Yuklanmoqda..." : "Bannerlar topilmadi"
        }}
      />

      <BannerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        banner={selectedBanner}
        mode={modalMode}
      />
    </Card>
  );
}
