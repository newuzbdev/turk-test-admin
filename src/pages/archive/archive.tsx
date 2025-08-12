import { ArchiveTable } from "./archive-table";
import { Card, Typography, Space } from "antd";
import { Archive as ArchiveIcon } from "lucide-react";

const { Title, Text } = Typography;

const Archive = () => {
  return (
    <main className="p-6">
      <div className="mb-6">
        <Space direction="vertical" size="small" className="w-full">
          <div className="flex items-center space-x-3">
            <ArchiveIcon className="text-blue-600" size={24} />
            <Title level={2} className="!mb-0">
              Arxiv
            </Title>
          </div>
          <Text type="secondary">
            O'chirilgan testlarni ko'rish va boshqarish
          </Text>
        </Space>
      </div>

      <Card className="shadow-sm">
        <ArchiveTable />
      </Card>
    </main>
  );
};

export default Archive;
