import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Typography } from "antd";
import { useReadingModalStore } from "../utils/reading-modal-store";
import { useGetAllIelts } from "../../../config/queries";
import { showNotification } from "../../../shared/utils/notification";
import ReadingForm from "./reading-form";
import type { CreateTestDto } from "../../../config/querys/test-query";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ReadingModalProps {
  hideAddButton?: boolean;
}

export const ReadingModal = ({ hideAddButton = false }: ReadingModalProps) => {
  const [form] = Form.useForm();
  const { open, onClose, data } = useReadingModalStore();
  const { data: ieltsData } = useGetAllIelts();
  const [step, setStep] = useState<"basic" | "creation">("basic");
  const [testData, setTestData] = useState<CreateTestDto | null>(null);

  const close = () => {
    form.resetFields();
    setStep("basic");
    setTestData(null);
    onClose();
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        ieltsId: data.ieltsId,
      });
      setTestData(data);
      setStep("creation");
    } else {
      setStep("basic");
      setTestData(null);
    }
  }, [data, form]);

  const handleBasicInfoSubmit = (values: any) => {
    const newTestData: CreateTestDto = {
      title: values.title,
      description: values.description,
      type: "READING",
      ieltsId: values.ieltsId,
      parts: [],
    };
    setTestData(newTestData);
    setStep("creation");

    showNotification.success({
      message: "Asosiy ma'lumotlar saqlandi",
      description: "Endi test tuzilmasini yaratishingiz mumkin",
    });
  };

  const handleTestSave = (finalTestData: CreateTestDto) => {
    const isEditing = !!data;

    // TODO: Implement actual API call
    console.log(
      isEditing ? "Updating" : "Creating",
      "reading test:",
      finalTestData
    );

    showNotification.success({
      message: isEditing ? "Test yangilandi" : "Test yaratildi",
      description: isEditing
        ? `"${finalTestData.title}" testi muvaffaqiyatli yangilandi`
        : `"${finalTestData.title}" testi muvaffaqiyatli yaratildi`,
    });

    close();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>📖</span>
          <Title level={4} style={{ margin: 0, color: "#10b981" }}>
            {data ? "Reading Testni Tahrirlash" : "Yangi Reading Test Yaratish"}
          </Title>
        </div>
      }
      open={open}
      onCancel={close}
      footer={null}
      width={step === "creation" ? "95%" : 600}
      style={{ top: step === "creation" ? 20 : undefined }}
      destroyOnClose
    >
      {step === "basic" && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBasicInfoSubmit}
          style={{ marginTop: "24px" }}
        >
          <Form.Item
            label="IELTS Test"
            name="ieltsId"
            rules={[{ required: true, message: "IELTS testni tanlang!" }]}
          >
            <Select
              placeholder="IELTS testni tanlang"
              size="large"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  ?.includes(input.toLowerCase())
              }
            >
              {ieltsData?.data?.map((ielts) => (
                <Option key={ielts.id} value={ielts.id}>
                  {ielts.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Test Nomi"
            name="title"
            rules={[{ required: true, message: "Test nomini kiriting!" }]}
          >
            <Input placeholder="Reading test nomini kiriting..." size="large" />
          </Form.Item>

          <Form.Item label="Test Tavsifi" name="description">
            <TextArea placeholder="Test haqida qisqacha ma'lumot..." rows={3} />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "24px" }}>
            <button
              type="button"
              onClick={close}
              style={{
                marginRight: "12px",
                padding: "8px 16px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 24px",
                border: "none",
                borderRadius: "6px",
                background: "#10b981",
                color: "white",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Davom etish
            </button>
          </div>
        </Form>
      )}

      {step === "creation" && testData && (
        <div style={{ margin: "-24px" }}>
          <ReadingForm
            initialData={testData}
            onSave={handleTestSave}
            onCancel={close}
          />
        </div>
      )}
    </Modal>
  );
};
