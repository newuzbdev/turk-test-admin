import { Button, Space, Tag, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { Product } from "../../../utils/types/types";
import type { TableColumnsType } from "antd";

interface ProductColumnsProps {
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const createProductColumns = ({ onEdit, onDelete }: ProductColumnsProps): TableColumnsType<Product> => [
  {
    title: "Ad",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "Fiyat",
    dataIndex: "price",
    key: "price",
    width: 120,
    sorter: (a, b) => a.price - b.price,
    render: (price: number) => (
      <Tag color="blue" style={{ fontSize: "14px", fontWeight: "bold" }}>
        {price.toLocaleString()} so'm
      </Tag>
    ),
  },
  {
    title: "Oluşturulma",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
    render: (date: string) => date ? new Date(date).toLocaleDateString() : "-",
  },
  {
    title: "İşlemler",
    key: "actions",
    width: 150,
    render: (_, record: Product) => (
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
          title="Paket silinsin mi?"
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

