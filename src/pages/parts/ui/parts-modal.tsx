import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import PartsForm from "./parts-form";
import { useCreatePart } from "@/config/queries/parts/create.queries";
import { useUpdatePart } from "@/config/queries/parts/update.queries";
import type { Part } from "@/utils/types/types";
import { usePartsModalStore } from "../utils/parts-modal-store";

interface PartsModalProps {
  hideAddButton?: boolean;
}

export const PartsModal = ({ hideAddButton = false }: PartsModalProps) => {
  const [form] = Form.useForm();
  const { mutateAsync: createPart, isPending: isCreating } = useCreatePart();
  const { mutateAsync: updatePart, isPending: isUpdating } = useUpdatePart();
  const { open, onClose, data } = usePartsModalStore();

  const close = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const onFinish = async (formData: Part) => {
    try {
      if (!data) {
        await createPart(formData);
      } else {
        if (data.id) {
          await updatePart({
            ...formData,
            id: data.id,
          });
        }
      }
      close();
    } catch (error) {
      console.error("Error saving part:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => usePartsModalStore.getState().onOpen()}
        >
          Yangi Qism
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={data ? "Qismni tahrirlash" : "Yangi qism qo'shish"}
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        confirmLoading={isCreating || isUpdating}
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <PartsForm />
      </Modal>
    </div>
  );
};
