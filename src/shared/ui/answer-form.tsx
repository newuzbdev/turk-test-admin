import { Checkbox, Input, Space, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { AnswerDto, QuestionType } from "../components/test-editor";

interface Props {
  answer: AnswerDto;
  type: QuestionType | null;
  index?: number;
  onChange: (a: AnswerDto) => void;
  onRemove?: () => void;
}

export default function AnswerForm({ answer, type, onChange, onRemove }: Props) {
  const updateField = (field: keyof AnswerDto, value: any) => {
    onChange({ ...answer, [field]: value });
  };

  const isEditable = type === "MULTIPLE_CHOICE" || type === "FILL_BLANK" || type === "TEXT_INPUT" || type === "MATCHING";

  return (
    <Space style={{ width: "100%" }}>
      <Input
        placeholder={isEditable ? "Answer text" : undefined}
        value={answer.text}
        disabled={!isEditable}
        onChange={(e) => updateField("text", e.target.value)}
        style={{ flex: 1 }}
      />
      <Checkbox
        checked={answer.isCorrect}
        onChange={(e) => updateField("isCorrect", e.target.checked)}
      >
        Correct
      </Checkbox>
      {onRemove && (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={onRemove} />
      )}
    </Space>
  );
}
