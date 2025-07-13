/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { useListeningModalStore } from "../utils/listening-modal-store";
import { useGetAllIelts } from "../../../config/queries";
import { useCreateTestWithAddition } from "../../../config/queries/test/create.queries";
import { useUpdateOnlyTest } from "../../../config/queries/test/update.queries";
import { showNotification } from "../../../shared/utils/notification";
import ListeningForm from "./listening-form";
import type { CreateTestDto } from "../../../config/querys/test-query";
import type { CreateTest } from "../../../utils/types/types";

const { TextArea } = Input;
const { Option } = Select;

export const ListeningModal = () => {
  const [form] = Form.useForm();
  const { open, onClose, data } = useListeningModalStore();
  const { data: ieltsData } = useGetAllIelts();
  const createTestMutation = useCreateTestWithAddition();
  const updateTestMutation = useUpdateOnlyTest();
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
      type: "LISTENING",
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

  // Transform CreateTestDto to CreateTest format for API
  const transformToApiFormat = (testData: CreateTestDto): CreateTest => {
    return {
      title: testData.title,
      type: testData.type,
      ieltsId: testData.ieltsId,
      // Note: parts will be created separately via parts API
      // This is just the basic test structure
    };
  };

  const handleTestSave = async (finalTestData: CreateTestDto) => {
    const isEditing = !!data;

    try {
      if (isEditing && data?.id) {
        // Update existing test
        await updateTestMutation.mutateAsync({
          id: data.id,
          title: finalTestData.title,
          type: finalTestData.type,
        });
      } else {
        // Create new test
        const apiData = transformToApiFormat(finalTestData);
        await createTestMutation.mutateAsync(apiData);
      }

      showNotification.success({
        message: isEditing ? "Test yangilandi" : "Test yaratildi",
        description: isEditing
          ? `"${finalTestData.title}" testi muvaffaqiyatli yangilandi`
          : `"${finalTestData.title}" testi muvaffaqiyatli yaratildi`,
      });

      close();
    } catch (error) {
      console.error("Error saving test:", error);
      showNotification.error({
        message: "Xatolik yuz berdi",
        description: isEditing
          ? "Test yangilanmadi, qaytadan urinib ko'ring"
          : "Test yaratilmadi, qaytadan urinib ko'ring",
      });
    }
  };

  return (
    <Modal
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
            <Input
              placeholder="Listening test nomini kiriting..."
              size="large"
            />
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
                background: "#1890ff",
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
          <ListeningForm
            initialData={testData}
            onSave={handleTestSave}
            onCancel={close}
          />
        </div>
      )}
    </Modal>
  );
};
