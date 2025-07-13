import React, { useState, useEffect } from "react";
import { Card, Button, Input, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { showNotification } from "../../../shared/utils/notification";
import ReadingPartForm from "./reading-part-form";
import type {
  CreateTestDto,
  TestPartDto,
} from "../../../config/querys/test-query";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ReadingFormProps {
  initialData?: CreateTestDto;
  onSave?: (data: CreateTestDto) => void;
  onCancel?: () => void;
}

export default function ReadingForm({
  initialData,
  onSave,
  onCancel,
}: ReadingFormProps) {
  const [testData, setTestData] = useState<CreateTestDto>(
    initialData || {
      title: "",
      description: "",
      type: "READING",
      ieltsId: "",
      parts: [],
    }
  );

  const updatePart = (index: number, updated: TestPartDto) => {
    const newParts = [...testData.parts];
    newParts[index] = updated;
    setTestData({ ...testData, parts: newParts });
  };

  const addPart = () => {
    const newPart: TestPartDto = {
      number: testData.parts.length + 1,
      title: "",
      sections: [],
    };
    setTestData({ ...testData, parts: [...testData.parts, newPart] });

    showNotification.success({
      message: "Yangi qism qo'shildi",
      description: `${newPart.number}-qism muvaffaqiyatli qo'shildi`,
    });
  };

  const removePart = (index: number) => {
    const partToRemove = testData.parts[index];
    const newParts = testData.parts.filter((_, i) => i !== index);
    // Renumber parts
    const renumberedParts = newParts.map((part, i) => ({
      ...part,
      number: i + 1,
    }));
    setTestData({ ...testData, parts: renumberedParts });

    showNotification.warning({
      message: "Qism o'chirildi",
      description: `"${
        partToRemove.title || `${partToRemove.number}-qism`
      }" o'chirildi`,
    });
  };

  useEffect(() => {
    if (initialData) {
      setTestData(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    if (onSave) {
      onSave(testData);
    } else {
      console.log("Saving reading test:", testData);
      // TODO: Implement API call
    }
  };

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <Card
        style={{
          marginBottom: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={2} style={{ color: "#10b981", marginBottom: "24px" }}>
          📖 Reading Test Yaratish
        </Title>

        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Text strong>Test nomi:</Text>
            <Input
              placeholder="Reading test nomini kiriting..."
              value={testData.title}
              onChange={(e) =>
                setTestData({ ...testData, title: e.target.value })
              }
              size="large"
              style={{ marginTop: "8px" }}
            />
          </div>

          <div>
            <Text strong>Test tavsifi:</Text>
            <TextArea
              placeholder="Test haqida qisqacha ma'lumot..."
              value={testData.description}
              onChange={(e) =>
                setTestData({ ...testData, description: e.target.value })
              }
              rows={3}
              style={{ marginTop: "8px" }}
            />
          </div>
        </Space>
      </Card>

      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Title level={3}>📚 Test Qismlari</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addPart}
            size="large"
            style={{ background: "#10b981", borderColor: "#10b981" }}
          >
            Yangi qism qo'shish
          </Button>
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {testData.parts.map((part, index) => (
            <ReadingPartForm
              key={index}
              part={part}
              onChange={(updated) => updatePart(index, updated)}
              onRemove={() => removePart(index)}
            />
          ))}

          {testData.parts.length === 0 && (
            <Card style={{ textAlign: "center", padding: "48px" }}>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                Hozircha hech qanday qism qo'shilmagan
              </Text>
              <br />
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addPart}
                size="large"
                style={{
                  marginTop: "16px",
                  borderColor: "#10b981",
                  color: "#10b981",
                }}
              >
                Birinchi qismni qo'shish
              </Button>
            </Card>
          )}
        </Space>
      </div>

      <Card style={{ textAlign: "center" }}>
        <Space size="middle">
          {onCancel && (
            <Button size="large" onClick={onCancel}>
              Bekor qilish
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            onClick={handleSave}
            disabled={!testData.title || testData.parts.length === 0}
            style={{ background: "#10b981", borderColor: "#10b981" }}
          >
            💾 Testni saqlash
          </Button>
        </Space>
      </Card>
    </div>
  );
}
