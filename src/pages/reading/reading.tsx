import { ReadingTable } from "./reading-table";
import ReadingDemo from "./components/reading-demo";
import ReadingQuickStart from "./components/reading-quick-start";
import { Tabs, Typography } from "antd";
import { TableOutlined, PlayCircleOutlined, BookOutlined } from "@ant-design/icons";

const { Title } = Typography;

const Reading = () => {
  return (
    <main style={{ padding: 24 }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
        Reading Test Management
      </Title>
      
      <Tabs
        defaultActiveKey="guide"
        items={[
          {
            key: "guide",
            label: (
              <span>
                <BookOutlined />
                Qo'llanma
              </span>
            ),
            children: <ReadingQuickStart />,
          },
          {
            key: "demo",
            label: (
              <span>
                <PlayCircleOutlined />
                Demo
              </span>
            ),
            children: <ReadingDemo />,
          },
          {
            key: "tests",
            label: (
              <span>
                <TableOutlined />
                Tests
              </span>
            ),
            children: <ReadingTable />,
          },
        ]}
      />
    </main>
  );
};

export default Reading;
