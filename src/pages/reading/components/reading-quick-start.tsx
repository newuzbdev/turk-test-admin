import React from "react";
import { Card, Steps, Typography, Space, Button, Alert } from "antd";
import { CheckCircleOutlined, EditOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

export default function ReadingQuickStart() {
  const steps = [
    {
      title: "Test ma'lumotlari",
      description: "Test sarlavhasi va tavsifini kiriting",
      icon: <EditOutlined />,
    },
    {
      title: "Part qo'shish",
      description: "Reading test uchun part qo'shing",
      icon: <PlusOutlined />,
    },
    {
      title: "Matn va savollar",
      description: "Turkish matnni kiriting va bo'sh joylar qo'shing",
      icon: <EditOutlined />,
    },
    {
      title: "Variantlar",
      description: "Har bir savol uchun A-H variantlar qo'shing",
      icon: <PlusOutlined />,
    },
    {
      title: "Saqlash",
      description: "Testni tekshirib saqlang",
      icon: <SaveOutlined />,
    },
  ];

  const exampleText = `Batıl inançlar, bilimsel bir temele dayanmayan, ancak birçok insanın günlük 
yaşamında etkili olan inanışlardır. Tarih boyunca insanlar, doğa olaylarını ve 
açıklayamadıkları durumları __________ (S1) güçlerle ilişkilendirmişlerdir.`;

  return (
    <Card
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
      title={
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
            🚀 Reading Test Yaratish Qo'llanmasi
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Qadam-baqadam ko'rsatma
          </Text>
        </div>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Steps
          direction="vertical"
          size="small"
          items={steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            icon: step.icon,
            status: index === 0 ? "process" : "wait",
          }))}
        />

        <Alert
          message="Muhim eslatma"
          description="Matnda bo'sh joylar uchun (S1), (S2), (S3) formatini ishlating. Bu format avtomatik ravishda savollar yaratish uchun ishlatiladi."
          type="info"
          showIcon
        />

        <Card
          size="small"
          title="📝 Matn kiritish misoli"
          style={{ backgroundColor: "#f9f9f9" }}
        >
          <div
            style={{
              padding: 16,
              backgroundColor: "#fff",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              fontSize: 14,
              fontFamily: "monospace",
            }}
          >
            {exampleText}
          </div>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
            Yuqoridagi matnda (S1) bo'sh joyi mavjud. Bu avtomatik ravishda S1 uchun savol yaratadi.
          </Text>
        </Card>

        <Card
          size="small"
          title="✅ Variantlar qo'shish"
          style={{ backgroundColor: "#f0f9ff" }}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text>Har bir savol uchun quyidagi variantlarni qo'shing:</Text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => (
                <div
                  key={letter}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {letter}.
                </div>
              ))}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Har bir variant uchun matn kiriting va to'g'ri javobni tanlang
            </Text>
          </Space>
        </Card>

        <div style={{ textAlign: "center", padding: 20 }}>
          <Button type="primary" size="large" icon={<CheckCircleOutlined />}>
            Reading Test Yaratishni Boshlash
          </Button>
        </div>
      </Space>
    </Card>
  );
}
