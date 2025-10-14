import { Typography } from "antd";
import ProductTable from "./product-table";

const { Title } = Typography;

export default function Product() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Mahsulot Boshqaruvi
      </Title>
      <ProductTable />
    </div>
  );
}


