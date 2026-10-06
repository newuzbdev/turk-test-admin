import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WritingForm from "./writing-form";
import { useCreateWritingTestV2 } from "@/config/queries/writing/v2.queries";
import { useWritingModalStore } from "../utils/writing-modal-store";

interface WritingModalProps {
  hideAddButton?: boolean;
}

export const WritingModal = ({ hideAddButton = false }: WritingModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { mutateAsync: createWritingTest, isPending } =
    useCreateWritingTestV2();
  const { open, onClose } = useWritingModalStore();

  const close = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (!open) form.resetFields();
  }, [form, open]);

  const onFinish = async (formData: { title: string; ieltsId: string }) => {
    try {
      const created = await createWritingTest(formData);
      close();
      navigate(`/writing/${created.id}/edit-v2`);
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
          Yeni yazma testi
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title="Yeni yazma testi"
        okText="Taslağı oluştur"
        cancelText="Vazgeç"
        confirmLoading={isPending}
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
