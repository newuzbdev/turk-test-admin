import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import SectionsForm from "./sections-form";
import { useCreateSection } from "@/config/queries/section/create.queries";
import { useUpdateSection } from "@/config/queries/section/update.queries";
import type { Section } from "@/utils/types/types";
import { useSectionsModalStore } from "../utils/sections-modal-store";

interface SectionsModalProps {
  hideAddButton?: boolean;
}

export const SectionsModal = ({ hideAddButton = false }: SectionsModalProps) => {
  const [form] = Form.useForm();
  const { mutateAsync: createSection, isPending: isCreating } = useCreateSection();
  const { mutateAsync: updateSection, isPending: isUpdating } = useUpdateSection();
  const { open, onClose, data } = useSectionsModalStore();

  const close = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const onFinish = async (formData: Section) => {
    try {
      if (!data) {
        await createSection(formData);
      } else {
        if (data.id) {
          await updateSection({
            ...formData,
            id: data.id,
          });
        }
      }
      close();
    } catch (error) {
      console.error("Error saving section:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useSectionsModalStore.getState().onOpen()}
        >
          Yangi Bo'lim
        </Button>
      )}

      <Modal
        open={open}
        width={800}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={data ? "Bo'limni tahrirlash" : "Yangi bo'lim qo'shish"}
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        confirmLoading={isCreating || isUpdating}
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <SectionsForm />
      </Modal>
    </div>
  );
};
