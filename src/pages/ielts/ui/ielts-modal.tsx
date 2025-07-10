import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import IeltsForm from "./ielts-form";
import { useCreateIelts } from "@/config/queries/ielts/create.queries";
import { useUpdateIelts } from "@/config/queries/ielts/update.queries";
import type { IELTS } from "@/utils/types/types";
import { useIeltsModalStore } from "../utils/ielts-modal-store";

interface IeltsModalProps {
  hideAddButton?: boolean;
}

export const IeltsModal = ({ hideAddButton = false }: IeltsModalProps) => {
  const [form] = Form.useForm();
  const { mutateAsync: createIelts, isPending: isCreating } = useCreateIelts();
  const { mutateAsync: updateIelts, isPending: isUpdating } = useUpdateIelts();
  const { open, onClose, data } = useIeltsModalStore();

  const close = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const onFinish = async (formData: IELTS) => {
    try {
      if (!data) {
        await createIelts(formData);
      } else {
        if (data.id) {
          await updateIelts({
            ...formData,
            id: data.id,
          });
        }
      }
      close();
    } catch (error) {
      console.error("Error saving IELTS:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useIeltsModalStore.getState().onOpen()}
        >
          Yangi IELTS Test
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={data ? "IELTS testini tahrirlash" : "Yangi IELTS test qo'shish"}
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        confirmLoading={isCreating || isUpdating}
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <IeltsForm />
      </Modal>
    </div>
  );
};
