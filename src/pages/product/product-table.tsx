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

  // Debug logging
  console.log("Product data:", productsResponse);
  console.log("Products array:", products);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

  // Normalize potential backend id field variations
  const normalizedProducts: Product[] = products.map((p: any) => ({
    ...p,
    id: p?.id ?? p?._id,
  }));

  // Filter products based on search
  const filteredProducts = normalizedProducts.filter((product: Product) => {
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
    if (!id) {
      message.error("Mahsulot ID topilmadi");
      return;
    }
    deleteProduct(String(id), {
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
        rowKey={(record: any) => record.id ?? record._id}
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


