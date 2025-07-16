import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReadingForm from "./reading-form";
import { useUpdateReadingTest } from "@/config/queries/reading/update.queries";
import { useReadingModalStore } from "../utils/reading-modal-store";

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
        const tempId = `temp-${Date.now()}`;
        navigate(`/reading/${tempId}/edit`, {
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
          Yangi Reading Test
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={data ? "Reading testini tahrirlash" : "Yangi Reading test qo'shish"}
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
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
