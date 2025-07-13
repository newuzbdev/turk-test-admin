import React from "react";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Space,
  Badge,
  Typography,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type {
  TestPartDto,
  TestSectionDto,
} from "../../../config/querys/test-query";

const { Title, Text } = Typography;

interface BasePartFormProps {
  part: TestPartDto;
  onChange: (part: TestPartDto) => void;
  onRemove: () => void;
  testType: "LISTENING" | "READING";
  sectionComponent: React.ComponentType<{
    section: TestSectionDto;
    onChange: (section: TestSectionDto) => void;
    onRemove: () => void;
    testType: "LISTENING" | "READING";
  }>;
}

export default function BasePartForm({
  part,
  onChange,
  onRemove,
  testType,
  sectionComponent: SectionComponent,
}: BasePartFormProps) {
  const updateSection = (index: number, updated: TestSectionDto) => {
    const newSections = [...part.sections];
    newSections[index] = updated;
    onChange({ ...part, sections: newSections });
  };

  const addSection = () => {
    const newSection: TestSectionDto = {
      title: "",
      content: "",
      imageUrl: "",
      questions: [],
    };
    onChange({ ...part, sections: [...part.sections, newSection] });
  };

  const removeSection = (index: number) => {
    const newSections = part.sections.filter((_, i) => i !== index);
    onChange({ ...part, sections: newSections });
  };

  const getPartIcon = () => {
    return testType === "LISTENING" ? "🎧" : "📖";
  };

  const getPartTypeText = () => {
    return testType === "LISTENING" ? "Listening Part" : "Reading Part";
  };

  const getSectionCountText = () => {
    const count = part.sections.length;
    return testType === "LISTENING" 
      ? `${count} ta bo'lim` 
      : `${count} ta bo'lim`;
  };

  return (
    <Card
      style={{
        marginBottom: 32,
        borderRadius: "16px",
        border: "2px solid #f0f9ff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: testType === "LISTENING" 
            ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          margin: "-24px -24px 24px -24px",
          padding: "20px 24px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              {getPartIcon()}
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: "white" }}>
                {getPartTypeText()} {part.number}
              </Title>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}
              >
                {getSectionCountText()}
              </Text>
            </div>
          </div>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={onRemove}
            style={{
              color: "rgba(255,255,255,0.9)",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
          >
            O'chirish
          </Button>
        </div>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: "28px" }}>
        <Col span={testType === "LISTENING" ? 12 : 24}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px" }}>
              📝 Part sarlavhasi
            </label>
          </div>
          <Input
            placeholder={
              testType === "LISTENING" 
                ? "Masalan: Kundalik suhbat" 
                : "Masalan: Academic Reading"
            }
            value={part.title}
            onChange={(e) => onChange({ ...part, title: e.target.value })}
            size="large"
          />
        </Col>
        
        {testType === "LISTENING" && (
          <Col span={12}>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontWeight: 600, fontSize: "14px" }}>
                🎵 Audio fayl
              </label>
            </div>
            <Upload
              maxCount={1}
              accept="audio/*"
              beforeUpload={(file) => {
                onChange({ ...part, audioUrl: URL.createObjectURL(file) });
                return false;
              }}
            >
              <Button
                size="large"
                icon={<UploadOutlined style={{ color: "#10b981" }} />}
                style={{ width: "100%" }}
              >
                Audio faylni yuklash
              </Button>
            </Upload>
          </Col>
        )}
      </Row>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <Text strong style={{ color: "#374151", fontSize: "16px" }}>
            📚 Bo'limlar
          </Text>
          <Badge
            count={part.sections.length}
            style={{
              background: "#10b981",
              color: "white",
              fontSize: "11px",
            }}
          />
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {part.sections.map((section, i) => (
            <div
              key={i}
              style={{
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <SectionComponent
                section={section}
                onChange={(updated: TestSectionDto) => updateSection(i, updated)}
                onRemove={() => removeSection(i)}
                testType={testType}
              />
            </div>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addSection}
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              border: "2px dashed #10b981",
              color: "#059669",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ✨ Yangi bo'lim qo'shish
          </Button>
        </Space>
      </div>
    </Card>
  );
}
