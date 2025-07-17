import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WritingForm from "./writing-form";
import { useUpdateWritingTest } from "@/config/queries/writing/update.queries";
import { useWritingModalStore } from "../utils/writing-modal-store";

interface WritingModalProps {
  hideAddButton?: boolean;
}

export const WritingModal = ({ hideAddButton = false }: WritingModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { mutateAsync: updateWritingTest } = useUpdateWritingTest();
  const { open, onClose, data } = useWritingModalStore();

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
        navigate(`/writing/${tempId}/edit`, {
          state: {
            isNew: true,
            testData: {
              title: formData.title,
              ieltsId: formData.ieltsId,
            },
          },
        });
      } else {
        // Update existing writing test
        if (data.id) {
          await updateWritingTest({
            id: data.id,
            title: formData.title,
            ieltsId: formData.ieltsId,
          });
        }
        close();
      }
    } catch (error) {
      console.error("Error saving writing test:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useWritingModalStore.getState().onOpen()}
        >
          Yangi Writing Test
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={data ? "Writing testini tahrirlash" : "Yangi Writing test qo'shish"}
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <WritingForm />
      </Modal>
    </div>
  );
};
