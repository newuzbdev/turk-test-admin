import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SpeakingForm from "./speaking-form";
import { useUpdateSpeakingTest } from "@/config/queries/speaking/update.queries";
import { useSpeakingModalStore } from "../utils/speaking-modal-store";

interface SpeakingModalProps {
  hideAddButton?: boolean;
}

export const SpeakingModal = ({ hideAddButton }: SpeakingModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { open, data, onOpen, onClose } = useSpeakingModalStore();
  const { mutateAsync: updateSpeakingTest } = useUpdateSpeakingTest();

  useEffect(() => {
    if (data) {
      console.log("Speaking modal data:", data); // Debug log
      form.setFieldsValue({
        title: data.title,
        ieltsId: data.ieltsId,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

  const close = () => {
    onClose();
    form.resetFields();
  };

  const onFinish = async (formData: { title: string; ieltsId: string }) => {
    try {
      if (!data) {
        // For new test creation, just navigate to editor without API call
        close();
        // Generate a temporary ID for the editor
        const tempId = `temp-${Date.now()}`;
        navigate(`/speaking/${tempId}/edit`, {
          state: {
            isNew: true,
            testData: {
              title: formData.title,
              ieltsId: formData.ieltsId,
            },
          },
        });
      } else {
        // Update existing speaking test
        if (data.id) {
          await updateSpeakingTest({
            id: data.id,
            title: formData.title,
            ieltsId: formData.ieltsId,
          });
        }
        close();
      }
    } catch (error) {
      console.error("Error saving speaking test:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useSpeakingModalStore.getState().onOpen()}
        >
          Yangi Speaking Test
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={
          data ? "Speaking testini tahrirlash" : "Yangi Speaking test qo'shish"
        }
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <SpeakingForm />
      </Modal>
    </div>
  );
};
