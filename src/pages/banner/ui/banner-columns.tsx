import { Button, Space, Tag, Image, Popconfirm } from "antd";
import type { TableColumnsType } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { Banner } from "../../../utils/types/types";

const FILE_BASE = `${(import.meta.env.VITE_API_URL || "https://api.turkishmock.uz").replace(/\/+$/, "")}/`;

interface BannerColumnsProps {
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
}

export const createBannerColumns = ({ onEdit, onDelete }: BannerColumnsProps): TableColumnsType<Banner> => [
  {
    title: "Görsel",
    dataIndex: "imageUrl",
    key: "imageUrl",
    width: 100,
    render: (imageUrl: string) => {
      const src = imageUrl?.startsWith("http") ? imageUrl : FILE_BASE + imageUrl;
      return (
        <Image
          src={src}
          alt="Banner"
          width={60}
          height={40}
          style={{ objectFit: "cover", borderRadius: 4 }}
        />
      );
    },
  },
  {
    title: "Ad",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "Başlık",
    dataIndex: "title",
    key: "title",
    ellipsis: true,
  },
  {
    title: "Açıklama",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    render: (description: string) => description || "-",
  },
  {
    title: "Link",
    dataIndex: "linkUrl",
    key: "linkUrl",
    ellipsis: true,
    render: (linkUrl: string) => linkUrl || "-",
  },
  {
    title: "Sıra",
    dataIndex: "order",
    key: "order",
    width: 80,
    sorter: (a, b) => (a.order || 0) - (b.order || 0),
  },
  {
    title: "Durum",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    render: (isActive: boolean) => (
      <Tag color={isActive ? "green" : "red"}>
        {isActive ? "Aktif" : "Pasif"}
      </Tag>
    ),
  },
  {
    title: "İşlemler",
    key: "actions",
    width: 150,
    render: (_, record: Banner) => (
      <Space size="small">
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          title="Görüntüle"
        />
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          title="Düzenle"
          onClick={() => onEdit(record)}
        />
        <Popconfirm
          title="Duyuru silinsin mi?"
          okText="Evet, sil"
          cancelText="Vazgeç"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(record.id ?? record._id ?? "")}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            title="Sil"
          />
        </Popconfirm>
      </Space>
    ),
  },
];
