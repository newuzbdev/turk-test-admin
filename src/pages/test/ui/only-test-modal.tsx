import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";

import { useOnlyTestModalStore } from "../utils/test-modal-store";
import { useCreateOnlyTest } from "../../../config/queries/test/create.queries";
import { useUpdateOnlyTest } from "../../../config/queries/test/update.queries";
import type { OnlyTest } from "../../../utils/types/types";
import OnlyTestForm from "./only-test-form";

interface OnlyTestModalProps {
  hideAddButton?: boolean;
}

export const OnlyTestModal = ({
  hideAddButton = false,
}: OnlyTestModalProps) => {
  const [form] = Form.useForm();
  const { mutateAsync: createOnlyTest, isPending: isCreating } =
    useCreateOnlyTest();
  const { mutateAsync: updateOnlyTest, isPending: isUpdating } =
    useUpdateOnlyTest();
  const { open, onClose, data } = useOnlyTestModalStore();

  const close = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const onFinish = async (formData: OnlyTest) => {
    try {
      if (!data) {
        await createOnlyTest(formData);
      } else {
        if (data.id) {
          await updateOnlyTest({
            ...formData,
            id: data.id,
          });
        }
      }
      close();
    } catch (error) {
      console.error("Error saving only test:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useOnlyTestModalStore.getState().onOpen()}
        >
          Yangi Test (Faqat test)
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={data ? "Testni tahrirlash" : "Yangi test qo'shish (Faqat test)"}
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        confirmLoading={isCreating || isUpdating}
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <OnlyTestForm />
      </Modal>
    </div>
  );
};
