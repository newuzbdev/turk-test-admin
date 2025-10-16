import { Button, Space, Tag, Image, Popconfirm } from "antd";
import type { TableColumnsType } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { Banner } from "../../../utils/types/types";

const FILE_BASE = "https://api.turkcetest.uz/";

interface BannerColumnsProps {
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
}

export const createBannerColumns = ({ onEdit, onDelete }: BannerColumnsProps): TableColumnsType<Banner> => [
  {
    title: "Rasm",
    dataIndex: "imageUrl",
    key: "imageUrl",
    width: 100,
    render: (imageUrl: string) => (
      <Image
        src={FILE_BASE + imageUrl}
        alt="Banner"
        width={60}
        height={40}
        style={{ objectFit: "cover", borderRadius: 4 }}
      />
    ),
  },
  {
    title: "Nomi",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "Sarlavha",
    dataIndex: "title",
    key: "title",
    ellipsis: true,
  },
  {
    title: "Tavsif",
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
    title: "Tartib",
    dataIndex: "order",
    key: "order",
    width: 80,
    sorter: (a, b) => (a.order || 0) - (b.order || 0),
  },
  {
    title: "Holat",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    render: (isActive: boolean) => (
      <Tag color={isActive ? "green" : "red"}>
        {isActive ? "Faol" : "Nofaol"}
      </Tag>
    ),
  },
  {
    title: "Amallar",
    key: "actions",
    width: 150,
    render: (_, record: Banner) => (
      <Space size="small">
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          title="Ko'rish"
        />
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          title="Tahrirlash"
          onClick={() => onEdit(record)}
        />
        <Popconfirm
          title="Bannerni o'chirishni tasdiqlaysizmi?"
          okText="Ha, o'chir"
          cancelText="Bekor qilish"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete((record as any).id ?? (record as any)._id)}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            title="O'chirish"
          />
        </Popconfirm>
      </Space>
    ),
  },
];
