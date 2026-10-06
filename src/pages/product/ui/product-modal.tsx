import { useEffect } from "react";
import { Modal, Form, Input, Button, InputNumber } from "antd";
import { useCreateProduct, useUpdateProduct } from "@/config/queries/product";
import type { Product, CreateProduct, UpdateProduct } from "@/utils/types/types";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  mode: "create" | "edit";
}

export default function ProductModal({ open, onClose, product, mode }: ProductModalProps) {
  const [form] = Form.useForm();

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && product) {
        form.setFieldsValue({
          name: product.name,
          price: product.price,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, product, form]);

  const handleSubmit = (values: CreateProduct) => {
    const productData: CreateProduct = {
      ...values,
    };

    if (mode === "create") {
      createProduct(productData, {
        onSuccess: () => {
          form.resetFields();
          onClose();
        },
      });
    } else if (mode === "edit" && product?.id) {
      updateProduct(
        { id: product.id, ...productData } satisfies UpdateProduct,
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={mode === "create" ? "Yeni paket" : "Paketi düzenle"}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Paket adı"
          rules={[
            { required: true, message: "Paket adını girin" },
            { min: 2, message: "Ad en az 2 karakter olmalı" },
            { max: 100, message: "Ad en fazla 100 karakter olabilir" }
          ]}
        >
          <Input 
            placeholder="Örn. Aylık üyelik"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="price"
          label="Fiyat (so'm)"
          rules={[
            { required: true, message: "Fiyatı girin" },
            { type: "number", min: 1, message: "Fiyat en az 1 olmalı" },
            { type: "number", max: 999999999, message: "Fiyat izin verilen üst sınırı aşıyor" }
          ]}
        >
          <InputNumber
            placeholder="Örn. 59000"
            style={{ width: "100%" }}
            size="large"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => (Number(value!.replace(/\$\s?|(,*)/g, '')) || 0) as 1 | 999999999}
            min={1}
            max={999999999}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={handleCancel} disabled={isPending} size="large">
              Vazgeç
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              size="large"
            >
              {mode === "create" ? "Oluştur" : "Güncelle"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

