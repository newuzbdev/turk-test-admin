import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";

import { useTestModalStore } from "../utils/test-modal-store";
import { useCreateTestWithAddition } from "../../../config/queries/test/create.queries";
import type { Test } from "../../../utils/types/types";
import TestForm from "./test-form";

interface TestModalProps {
  hideAddButton?: boolean;
}

export const TestModal = ({ hideAddButton = false }: TestModalProps) => {
  const [form] = Form.useForm();
  const { mutateAsync: createTest, isPending: isCreating } =
    useCreateTestWithAddition();
  const { open, onClose, data } = useTestModalStore();

  const close = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const onFinish = async (formData: Test) => {
    try {
      await createTest(formData);
      close();
    } catch (error) {
      console.error("Error saving test:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useTestModalStore.getState().onOpen()}
        >
          Yangi Test (Qo'shimcha ma'lumotlar bilan)
        </Button>
      )}

      <Modal
        open={open}
        width={800}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title="Yangi test qo'shish (Qo'shimcha ma'lumotlar bilan)"
        okText="Qo'shish"
        cancelText="Bekor qilish"
        confirmLoading={isCreating}
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <TestForm />
      </Modal>
    </div>
  );
};
