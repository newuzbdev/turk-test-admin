import { Typography } from "antd";
import BannerTable from "./banner-table";

const { Title } = Typography;

export default function Banner() {
  return (
    <div className="admin-page">
      <Title level={2} style={{ marginBottom: 24 }}>
        Duyurular
      </Title>
      <BannerTable />
    </div>
  );
}
