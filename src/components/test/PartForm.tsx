import { Input, Button, Space, Typography } from 'antd';
import SectionForm from './SectionForm';
import type { TestPartDto, TestSectionDto } from '../../config/querys/test-query';

const { Title } = Typography;

type Props = {
  part: TestPartDto;
  onChange: (part: TestPartDto) => void;
  onRemove: () => void;
};

export default function PartForm({ part, onChange, onRemove }: Props) {
  const updateSection = (index: number, updated: TestSectionDto) => {
    const newSections = [...part.sections];
    newSections[index] = updated;
    onChange({ ...part, sections: newSections });
  };

  const addSection = () => {
    const newSection: TestSectionDto = {
      title: '',
      content: '',
      imageUrl: '',
      questions: [],
    };
    onChange({ ...part, sections: [...part.sections, newSection] });
  };

  const removeSection = (index: number) => {
    const newSections = part.sections.filter((_, i) => i !== index);
    onChange({ ...part, sections: newSections });
  };

  return (
    <div style={{ marginBottom: 24, padding: 16, border: '2px solid #bbb', borderRadius: 8 }}>
      <Space direction='vertical' style={{ width: '100%' }}>
        <Title level={3}>Part #{part.number}</Title>

        <Input
          placeholder='Part sarlavhasi'
          value={part.title}
          onChange={(e) => onChange({ ...part, title: e.target.value })}
        />

        <Input
          placeholder='Audio URL'
          value={part.audioUrl}
          onChange={(e) => onChange({ ...part, audioUrl: e.target.value })}
        />

        <div>
          <Title level={4}>Bo‘limlar</Title>
          {part.sections.map((section, i) => (
            <SectionForm
              key={i}
              section={section}
              onChange={(updated) => updateSection(i, updated)}
              onRemove={() => removeSection(i)}
            />
          ))}
          <Button type='dashed' onClick={addSection}>+ Bo‘lim qo‘shish</Button>
        </div>

        <Button danger type='text' onClick={onRemove}>❌ Partni o‘chirish</Button>
      </Space>
    </div>
  );
}
