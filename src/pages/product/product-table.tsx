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
  const products: Product[] = Array.isArray(productsResponse?.data)
    ? productsResponse.data
    : Array.isArray(productsResponse)
    ? productsResponse
    : [];


  // Normalize potential backend id field variations
  const normalizedProducts: Product[] = products.map((p) => ({
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
      message.error("Paket bulunamadı");
      return;
    }
    deleteProduct(String(id), {
      onSuccess: () => {
        message.success("Paket silindi");
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Silmek için paket seçin");
      return;
    }
    // Implement bulk delete logic here
    message.info("Toplu silme henüz kullanılamıyor");
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
          <h3>Yükleme başarısız</h3>
          <p>Paketler yüklenemedi: {error.message}</p>
          <Button type="primary" onClick={() => refetch()}>
            Tekrar dene
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
            placeholder="Paket ara"
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
            Yeni paket
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Güncelle
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={handleBulkDelete}
              loading={isDeleting}
            >
              Seçilenleri sil ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={productColumns}
        dataSource={filteredProducts}
        rowKey={(record) => record.id ?? record._id ?? ""}
        loading={isLoading}
        rowSelection={rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total} paket`,
        }}
        scroll={{ x: 600 }}
        locale={{
          emptyText: isLoading ? "Yükleniyor…" : "Paket bulunamadı"
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

