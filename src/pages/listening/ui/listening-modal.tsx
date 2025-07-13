import { PlusOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useEffect, useState } from "react";
import ListeningForm from "./listening-form";
import { useCreateListeningTest } from "@/config/queries/listening/create.queries";
import { useUpdateListeningTest } from "@/config/queries/listening/update.queries";
import type { Test, CreateTest } from "@/utils/types/types";
import { useListeningModalStore } from "../utils/listening-modal-store";

interface ListeningModalProps {
  hideAddButton?: boolean;
}

export const ListeningModal = ({ hideAddButton = false }: ListeningModalProps) => {
  const { mutateAsync: createTest, isPending: isCreating } = useCreateListeningTest();
  const { mutateAsync: updateTest, isPending: isUpdating } = useUpdateListeningTest();
  const { open, onClose, data } = useListeningModalStore();
  const [formData, setFormData] = useState<CreateTest | null>(null);

  const close = () => {
    setFormData(null);
    onClose();
  };

  useEffect(() => {
    if (data) {
      setFormData({
        title: data.title,
        type: "LISTENING",
        ieltsId: data.ieltsId,
        parts: data.parts || [],
      });
    } else {
      setFormData({
        title: "",
        type: "LISTENING",
        ieltsId: "",
        parts: [],
      });
    }
  }, [data]);

  const handleSubmit = async (submitData: CreateTest) => {
    try {
      if (!data) {
        await createTest(submitData);
      } else {
        if (data.id) {
          await updateTest({
            ...submitData,
            id: data.id,
          });
        }
      }
      close();
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
        width={1200}
        onCancel={close}
        destroyOnClose
        footer={null}
        title={data ? "Listening testini tahrirlash" : "Yangi Listening test qo'shish"}
      >
        {formData && (
          <ListeningForm
            onSubmit={handleSubmit}
            onCancel={close}
            initialData={formData}
            isLoading={isCreating || isUpdating}
          />
        )}
      </Modal>
    </div>
  );
};
