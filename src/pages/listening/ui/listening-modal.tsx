import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Modal } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ListeningForm from "./listening-form";
// import { useCreateListeningTest } from "@/config/queries/listening/create.queries";
import { useUpdateListeningTest } from "@/config/queries/listening/update.queries";
import { useListeningModalStore } from "../utils/listening-modal-store";

interface ListeningModalProps {
  hideAddButton?: boolean;
}

export const ListeningModal = ({
  hideAddButton = false,
}: ListeningModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  // const { mutateAsync: createListeningTest, isPending: isCreating } =
  //   useCreateListeningTest();
  const { mutateAsync: updateListeningTest } = useUpdateListeningTest();
  const { open, onClose, data } = useListeningModalStore();

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
        navigate(`/listening/${tempId}/edit`, {
          state: {
            isNew: true,
            testData: {
              title: formData.title,
              ieltsId: formData.ieltsId,
              type: "LISTENING",
            },
          },
        });
      } else {
        // Update existing listening test
        if (data.id) {
          await updateListeningTest({
            id: data.id,
            title: formData.title,
            ieltsId: formData.ieltsId,
            type: "LISTENING",
          });
        }
        close();
      }
    } catch (error) {
      console.error("Error saving listening test:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {!hideAddButton && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => useListeningModalStore.getState().onOpen()}
        >
          Yangi Listening Test
        </Button>
      )}

      <Modal
        open={open}
        width={600}
        onCancel={close}
        destroyOnClose
        onOk={form.submit}
        title={
          data
            ? "Listening testini tahrirlash"
            : "Yangi Listening test qo'shish"
        }
        okText={data ? "Saqlash" : "Qo'shish"}
        cancelText="Bekor qilish"
        // confirmLoading={isCreating || isUpdating}
        modalRender={(node) => (
          <Form layout="vertical" size="large" onFinish={onFinish} form={form}>
            {node}
          </Form>
        )}
      >
        <ListeningForm />
      </Modal>
    </div>
  );
};
