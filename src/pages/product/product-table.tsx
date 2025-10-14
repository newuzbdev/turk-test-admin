import React, { useState } from "react";
import { Table, Card, Button, Space, Input, message } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useGetAllProducts, useDeleteProduct } from "@/config/queries/product";
import { createProductColumns } from "./ui/product-columns";
import ProductModal from "./ui/product-modal";
import type { Product } from "@/utils/types/types";

const { Search } = Input;

export default function ProductTable() {
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: productsResponse, isLoading, refetch, error } = useGetAllProducts();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  // Handle different possible response structures
  const products = Array.isArray(productsResponse?.data) 
    ? productsResponse.data 
    : Array.isArray(productsResponse) 
    ? productsResponse 
    : [];

  // Temporary mock data for testing
  const mockProducts = [
    {
      id: "1",
      name: "iPhone 15 Pro",
      price: 15000000,
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-01T10:00:00Z"
    },
    {
      id: "2", 
      name: "Samsung Galaxy S24",
      price: 12000000,
      createdAt: "2024-01-02T10:00:00Z",
      updatedAt: "2024-01-02T10:00:00Z"
    },
    {
      id: "3",
      name: "MacBook Pro M3",
      price: 25000000,
      createdAt: "2024-01-03T10:00:00Z",
      updatedAt: "2024-01-03T10:00:00Z"
    }
  ];

  // Use mock data if no real data
  const displayProducts = products.length > 0 ? products : mockProducts;

  // Debug logging
  console.log("Product data:", productsResponse);
  console.log("Products array:", products);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

  // Filter products based on search
  const filteredProducts = displayProducts.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleCreate = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id, {
      onSuccess: () => {
        message.success("Mahsulot o'chirildi");
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("O'chirish uchun mahsulot tanlang");
      return;
    }
    // Implement bulk delete logic here
    message.info("Bulk delete functionality to be implemented");
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const productColumns = createProductColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <h3>Xatolik yuz berdi</h3>
          <p>Mahsulotlarni yuklashda xatolik: {error.message}</p>
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
            placeholder="Mahsulot qidirish..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Yangi Mahsulot
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
        columns={productColumns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={isLoading}
        rowSelection={rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total} ta mahsulot`,
        }}
        scroll={{ x: 600 }}
        locale={{
          emptyText: isLoading ? "Yuklanmoqda..." : "Mahsulotlar topilmadi"
        }}
      />

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={selectedProduct}
        mode={modalMode}
      />
    </Card>
  );
}


