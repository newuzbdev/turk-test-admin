import { Button, Form, message, Modal } from "antd";
import { Plus } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useCreateSpeakingV2 } from "@/config/queries/speaking/v2.queries";

import SpeakingForm from "./speaking-form";
import { useSpeakingModalStore } from "../utils/speaking-modal-store";

interface SpeakingModalProps {
  hideAddButton?: boolean;
}

export const SpeakingModal = ({ hideAddButton }: SpeakingModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { open, onClose } = useSpeakingModalStore();
  const createSpeakingV2 = useCreateSpeakingV2();
  const createInFlightRef = useRef(false);

  const close = () => {
    onClose();
    form.resetFields();
  };

  const handleCreate = async (values: { title: string; ieltsId: string }) => {
    if (createInFlightRef.current) return;
    createInFlightRef.current = true;
    try {
      const created = await createSpeakingV2.mutateAsync(values);
      form.resetFields();
      onClose();
      navigate(`/speaking/${created.id}/edit`);
    } catch {
      message.error(
        "Konuşma taslağı oluşturulamadı. Bilgileriniz ekranda korunuyor.",
      );
    } finally {
      createInFlightRef.current = false;
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<Plus />}
          onClick={() => useSpeakingModalStore.getState().onOpen()}
        >
          Yeni konuşma testi
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnHidden
        onOk={form.submit}
        title="Yeni konuşma testi"
        okText="Devam et"
        cancelText="Vazgeç"
        confirmLoading={createSpeakingV2.isPending}
        okButtonProps={{ disabled: createSpeakingV2.isPending }}
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={handleCreate} form={form}>
            {node}
          </Form>
        )}
      >
        <SpeakingForm />
      </Modal>
    </div>
  );
};
