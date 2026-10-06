import { Typography } from "antd";
import ProductTable from "./product-table";

const { Title } = Typography;

export default function Product() {
  return (
    <div className="admin-page">
      <Title level={2} style={{ marginBottom: 24 }}>
        Paketler
      </Title>
      <ProductTable />
    </div>
  );
}


