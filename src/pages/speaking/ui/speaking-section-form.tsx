import { Card, Input, Button, Space } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import type {
  SpeakingSection,
  SpeakingSubPart,
} from "../../../utils/types/types";

type Props = {
  section: SpeakingSection;
  onChange: (section: SpeakingSection) => void;
  onRemove: () => void;
};

export default function SpeakingSectionForm({
  section,
  onChange,
  onRemove,
}: Props) {
  const [sec, setSec] = useState<SpeakingSection>(section);

  const sync = (updated: SpeakingSection) => {
    setSec(updated);
    onChange(updated);
  };

  const addSubPart = () => {
    const newSubPart: SpeakingSubPart = {
      label: "",
      description: "",
      questions: [],
    };
    sync({ ...sec, subParts: [...sec.subParts, newSubPart] });
  };

  const removeSubPart = (index: number) => {
    const updated = [...sec.subParts];
    updated.splice(index, 1);
    sync({ ...sec, subParts: updated });
  };

  const updateSubPart = (index: number, updatedSubPart: SpeakingSubPart) => {
    const updated = [...sec.subParts];
    updated[index] = updatedSubPart;
    sync({ ...sec, subParts: updated });
  };

  return (
    <Card
      title={`Part ${sec.order}`}
      extra={
        <Button danger icon={<DeleteOutlined />} onClick={onRemove}>
          O‘chir
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Input
          value={sec.title}
          placeholder="Sarlavha"
          onChange={(e) => sync({ ...sec, title: e.target.value })}
        />
        <Input.TextArea
          value={sec.content}
          placeholder="Asosiy matn"
          onChange={(e) => sync({ ...sec, content: e.target.value })}
          rows={3}
        />

        <Space direction="vertical" style={{ width: "100%" }}>
          {sec.subParts.map((sp, i) => (
            <Card
              key={i}
              size="small"
              title={`Sub-part ${sp.label || i + 1}`}
              extra={
                <Button danger size="small" onClick={() => removeSubPart(i)}>
                  <DeleteOutlined />
                </Button>
              }
            >
              <Input
                placeholder="Label"
                value={sp.label}
                onChange={(e) =>
                  updateSubPart(i, { ...sp, label: e.target.value })
                }
              />
              <Input.TextArea
                placeholder="Description"
                value={sp.description}
                onChange={(e) =>
                  updateSubPart(i, { ...sp, description: e.target.value })
                }
                rows={2}
              />
            </Card>
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={addSubPart}>
            Sub-part qo‘shish
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
