import { Button, Form, Modal } from "antd";

import { PlusOutlined } from "@ant-design/icons";
import ReadingForm from "./reading-form";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReadingModalStore } from "../utils/reading-modal-store";
import { useUpdateReadingTest } from "@/config/queries/reading/update.queries";

interface ReadingModalProps {
  hideAddButton?: boolean;
}

export const ReadingModal = ({ hideAddButton = false }: ReadingModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { mutateAsync: updateReadingTest } = useUpdateReadingTest();
  const { open, onClose, data } = useReadingModalStore();

  const close = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data.title,
        ieltsId: data.ieltsId,
      });
    }
  }, [data, form]);

  const onFinish = async (formData: { title: string; ieltsId: string }) => {
    try {
      if (!data) {
        // For new test creation, just navigate to editor without API call
        close();
        // Generate a temporary ID for the editor
        // const tempId = `temp-${Date.now()}`;
        navigate(`/reading/new/${formData.ieltsId}/edit-v3`, {
          state: {
            isNew: true,
            testData: {
              title: formData.title,
              ieltsId: formData.ieltsId,
              type: "READING",
            },
          },
        });
      } else {
        // Update existing reading test
        if (data.id) {
          await updateReadingTest({
            id: data.id,
            title: formData.title,
            ieltsId: formData.ieltsId,
            type: "READING",
          });
        }
        close();
      }
    } catch (error) {
      console.error("Error saving reading test:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useReadingModalStore.getState().onOpen()}
        >
          Yeni okuma testi
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={
          data ? "Okuma testini düzenle" : "Yeni okuma testi"
        }
        okText={data ? "Kaydet" : "Devam et"}
        cancelText="Vazgeç"
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <ReadingForm />
      </Modal>
    </div>
  );
};
