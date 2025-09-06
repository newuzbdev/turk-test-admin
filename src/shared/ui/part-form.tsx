import { Button, Card, Input, Space } from "antd";
import type { PartDto, SectionDto } from "../components/test-editor";
import SectionForm from "./section-form";

interface Props {
  part: PartDto;
  onChange: (part: PartDto) => void;
  onRemove: () => void;
}

export default function PartForm({ part, onChange, onRemove }: Props) {
  const updateField = (field: keyof PartDto, value: any) => {
    onChange({ ...part, [field]: value });
  };

  const addSection = () => {
    const newSection: SectionDto = {
      title: "",
      content: "",
      imageUrl: "",
      type: null,
      questions: [],
    };
    onChange({ ...part, sections: [...part.sections, newSection] });
  };

  const updateSection = (index: number, updated: SectionDto) => {
    const newSections = [...part.sections];
    newSections[index] = updated;
    onChange({ ...part, sections: newSections });
  };

  const removeSection = (index: number) => {
    onChange({ ...part, sections: part.sections.filter((_, i) => i !== index) });
  };

  return (
    <Card
      title={
        <Input
          placeholder="Part title"
          value={part.title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      }
      className="mb-4"
      extra={<Button danger onClick={onRemove}>Remove Part</Button>}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input
          placeholder="Part description (optional)"
          value={part.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
        <Input
          placeholder="Audio URL (optional)"
          value={part.audioUrl}
          onChange={(e) => updateField("audioUrl", e.target.value)}
        />

        {part.sections.map((s, idx) => (
          <SectionForm
            key={idx}
            section={s}
            onChange={(updated) => updateSection(idx, updated)}
            onRemove={() => removeSection(idx)}
          />
        ))}

        <Button type="dashed" onClick={addSection}>
          + Add Section
        </Button>
      </Space>
    </Card>
  );
}
