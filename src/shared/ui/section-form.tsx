import { Button, Card, Input, Select, Space } from "antd";
import type { QuestionDto, SectionDto } from "../components/test-editor";
import QuestionForm from "./question-form";

interface Props {
  section: SectionDto;
  onChange: (section: SectionDto) => void;
  onRemove: () => void;
}

const options = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "Text Input", value: "TEXT_INPUT" },
  { label: "True / False", value: "TRUE_FALSE" },
  { label: "Matching", value: "MATCHING" },
  { label: "Fill Blank", value: "FILL_BLANK" },
];

export default function SectionForm({ section, onChange, onRemove }: Props) {
  const updateField = (field: keyof SectionDto, value: any) => {
    // when type changes, reset questions.answers to match new type
    if (field === "type") {
      onChange({ ...section, type: value, questions: [] });
      return;
    }
    onChange({ ...section, [field]: value });
  };

  const addQuestion = () => {
    const newQ: QuestionDto = { text: "", content: "", answers: [] };
    onChange({ ...section, questions: [...section.questions, newQ] });
  };

  const updateQuestion = (index: number, updated: QuestionDto) => {
    const newQs = [...section.questions];
    newQs[index] = updated;
    onChange({ ...section, questions: newQs });
  };

  const removeQuestion = (index: number) => {
    onChange({
      ...section,
      questions: section.questions.filter((_, i) => i !== index),
    });
  };

  return (
    <Card
      title={
        <Input
          placeholder="Section title"
          value={section.title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      }
      className="mb-4"
      extra={<Button danger onClick={onRemove}>Remove Section</Button>}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input
          placeholder="Section content (optional)"
          value={section.content}
          onChange={(e) => updateField("content", e.target.value)}
        />
        <Input
          placeholder="Section image URL (optional)"
          value={section.imageUrl}
          onChange={(e) => updateField("imageUrl", e.target.value)}
        />

        <Select
          placeholder="Select question type for this section"
          value={section.type ?? undefined}
          onChange={(val) => updateField("type", val)}
          style={{ width: 280 }}
          options={options}
        />

        <Button
          type="dashed"
          onClick={addQuestion}
          disabled={!section.type}
        >
          + Add Question
        </Button>

        {section.questions.map((q, idx) => (
          <QuestionForm
            key={idx}
            question={q}
            type={section.type}
            onChange={(updated) => updateQuestion(idx, updated)}
            onRemove={() => removeQuestion(idx)}
          />
        ))}
      </Space>
    </Card>
  );
}
