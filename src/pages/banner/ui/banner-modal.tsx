import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, message, Switch, InputNumber } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCreateBanner, useUpdateBanner } from "@/config/queries/banner";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { Banner, CreateBanner, UpdateBanner } from "@/utils/types/types";

const { TextArea } = Input;
const FILE_BASE = "https://api.turkcetest.uz/";

interface BannerModalProps {
  open: boolean;
  onClose: () => void;
  banner?: Banner | null;
  mode: "create" | "edit";
}

export default function BannerModal({ open, onClose, banner, mode }: BannerModalProps) {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { mutate: createBanner, isPending: isCreating } = useCreateBanner();
  const { mutate: updateBanner, isPending: isUpdating } = useUpdateBanner();
  const fileUploadMutation = useFileUpload();

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && banner) {
        form.setFieldsValue({
          name: banner.name,
          title: banner.title,
          description: banner.description,
          linkUrl: banner.linkUrl,
          isActive: banner.isActive ?? true,
          order: banner.order ?? 1,
        });
        setImageUrl(banner.imageUrl);
      } else {
        form.resetFields();
        setImageUrl("");
      }
    }
  }, [open, mode, banner, form]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await fileUploadMutation.mutateAsync(file);
      if (result?.path) {
        setImageUrl(result.path);
        message.success("Rasm yuklandi");
      }
    } catch (error) {
      message.error("Rasm yuklashda xatolik");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSubmit = async (values: any) => {
    if (!imageUrl) {
      message.error("Rasm yuklash kerak");
      return;
    }

    const bannerData = {
      ...values,
      imageUrl,
    };

    if (mode === "create") {
      createBanner(bannerData as CreateBanner, {
        onSuccess: () => {
          form.resetFields();
          setImageUrl("");
          onClose();
        },
      });
    } else if (mode === "edit" && banner?.id) {
      updateBanner(
        { id: banner.id, ...bannerData } as UpdateBanner,
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
    setImageUrl("");
    onClose();
  };

  return (
    <Modal
      title={mode === "create" ? "Yangi Banner Yaratish" : "Banner Tahrirlash"}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isActive: true,
          order: 1,
        }}
      >
        <Form.Item
          name="name"
          label="Nomi"
          rules={[{ required: true, message: "Nomi kiritish kerak" }]}
        >
          <Input placeholder="Masalan: Summer Sale" />
        </Form.Item>

        <Form.Item
          name="title"
          label="Sarlavha"
          rules={[{ required: true, message: "Sarlavha kiritish kerak" }]}
        >
          <Input placeholder="Masalan: Big Discounts" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Tavsif"
        >
          <TextArea
            rows={3}
            placeholder="Banner haqida qisqacha ma'lumot..."
          />
        </Form.Item>

        <Form.Item
          name="linkUrl"
          label="Havola URL"
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          label="Rasm"
          required
        >
          <div>
            <Upload
              showUploadList={false}
              accept="image/*"
              beforeUpload={handleImageUpload}
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                disabled={isPending}
              >
                {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
              </Button>
            </Upload>
            {imageUrl && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={FILE_BASE + imageUrl}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: 200,
                    objectFit: "contain",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setImageUrl("")}
                  style={{ marginTop: 4 }}
                >
                  O'chirish
                </Button>
              </div>
            )}
          </div>
        </Form.Item>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            name="isActive"
            label="Faol"
            valuePropName="checked"
            style={{ flex: 1 }}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="order"
            label="Tartib"
            style={{ flex: 1 }}
          >
            <InputNumber
              min={1}
              max={999}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={handleCancel} disabled={isPending}>
              Bekor qilish
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              disabled={!imageUrl}
            >
              {mode === "create" ? "Yaratish" : "Yangilash"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}


