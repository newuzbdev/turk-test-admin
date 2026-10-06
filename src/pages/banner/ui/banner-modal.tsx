import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, message, Switch, InputNumber } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCreateBanner, useUpdateBanner } from "@/config/queries/banner";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type { Banner, CreateBanner, UpdateBanner } from "@/utils/types/types";

const { TextArea } = Input;
const FILE_BASE = `${(import.meta.env.VITE_API_URL || "https://api.turkishmock.uz").replace(/\/+$/, "")}/`;

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

      // Support both relative `path` and absolute `url` / nested paths from backend
      const uploadedPath: string =
        result?.data?.url ||
        result?.data?.reference ||
        result?.path ||
        result?.data?.path ||
        "";

      if (uploadedPath) {
        setImageUrl(uploadedPath);
        message.success("Görsel yuklandi");
      } else {
        message.error("Görsel manzili aniqlanmadi");
      }
    } catch {
      message.error("Görsel yükleda xatolik");
    } finally {
      setUploading(false);
    }
    // prevent Upload from doing its own request
    return false;
  };

  const handleSubmit = (values: Omit<CreateBanner, "imageUrl">) => {
    if (!imageUrl) {
      message.error("Görsel yükle kerak");
      return;
    }

    const bannerData: CreateBanner = {
      ...values,
      imageUrl,
    };

    if (mode === "create") {
      createBanner(bannerData, {
        onSuccess: () => {
          form.resetFields();
          setImageUrl("");
          onClose();
        },
      });
    } else if (mode === "edit" && banner?.id) {
      updateBanner(
        { id: banner.id, ...bannerData } satisfies UpdateBanner,
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
      title={mode === "create" ? "Yeni duyuru" : "Duyuruyu düzenle"}
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
          label="Ad"
          rules={[{ required: true, message: "Adı girin" }]}
        >
          <Input placeholder="Örn. Yeni deneme" />
        </Form.Item>

        <Form.Item
          name="title"
          label="Başlık"
          rules={[{ required: true, message: "Başlığı girin" }]}
        >
          <Input placeholder="Duyuru başlığı" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Açıklama"
        >
          <TextArea
            rows={3}
            placeholder="Kısa açıklama"
          />
        </Form.Item>

        <Form.Item
          name="linkUrl"
          label="Bağlantı"
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          label="Görsel"
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
                {uploading ? "Yükleniyor…" : "Görsel yükle"}
              </Button>
            </Upload>
            {imageUrl && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={imageUrl.startsWith("http") ? imageUrl : FILE_BASE + imageUrl}
                  alt="Önizleme"
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
                  Sil
                </Button>
              </div>
            )}
          </div>
        </Form.Item>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            name="isActive"
            label="Aktif"
            valuePropName="checked"
            style={{ flex: 1 }}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="order"
            label="Sıra"
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
              Vazgeç
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              disabled={!imageUrl}
            >
              {mode === "create" ? "Oluştur" : "Güncelle"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

