import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, InputNumber, message } from "antd";
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

  const handleSubmit = async (values: any) => {
    const productData = {
      ...values,
    };

    if (mode === "create") {
      createProduct(productData as CreateProduct, {
        onSuccess: () => {
          form.resetFields();
          onClose();
        },
      });
    } else if (mode === "edit" && product?.id) {
      updateProduct(
        { id: product.id, ...productData } as UpdateProduct,
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
      title={mode === "create" ? "Yangi Mahsulot Yaratish" : "Mahsulot Tahrirlash"}
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
          label="Mahsulot nomi"
          rules={[
            { required: true, message: "Mahsulot nomi kiritish kerak" },
            { min: 2, message: "Nom kamida 2 ta belgi bo'lishi kerak" },
            { max: 100, message: "Nom 100 ta belgidan ko'p bo'lmasligi kerak" }
          ]}
        >
          <Input 
            placeholder="Masalan: iPhone 15 Pro" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="price"
          label="Narx (so'm)"
          rules={[
            { required: true, message: "Narx kiritish kerak" },
            { type: "number", min: 1, message: "Narx 1 dan katta bo'lishi kerak" },
            { type: "number", max: 999999999, message: "Narx juda katta" }
          ]}
        >
          <InputNumber
            placeholder="Masalan: 15000000"
            style={{ width: "100%" }}
            size="large"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            min={1}
            max={999999999}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={handleCancel} disabled={isPending} size="large">
              Bekor qilish
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              size="large"
            >
              {mode === "create" ? "Yaratish" : "Yangilash"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}


