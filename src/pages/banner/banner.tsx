import { Typography } from "antd";
import BannerTable from "./banner-table";

const { Title } = Typography;

export default function Banner() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Banner Boshqaruvi
      </Title>
      <BannerTable />
    </div>
  );
}
