import { Button, Card, Col, Divider, Input, Row, Space, Typography } from 'antd';
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
    <Card
      title={`🎧 Part #${part.number}`}
      extra={<Button danger type='text' onClick={onRemove}>🗑 Partni o‘chirish</Button>}
      style={{ marginBottom: 24, border: '1px solid #ddd', borderRadius: 8 }}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Input
            placeholder='Part sarlavhasi'
            value={part.title}
            onChange={(e) => onChange({ ...part, title: e.target.value })}
            size='large'
          />
        </Col>
        <Col span={12}>
          <Input
            placeholder='Audio URL'
            value={part.audioUrl}
            onChange={(e) => onChange({ ...part, audioUrl: e.target.value })}
            size='large'
          />
        </Col>
      </Row>

      <Divider orientation='left'>📚 Bo‘limlar</Divider>

      <Space direction='vertical' style={{ width: '100%' }}>
        {part.sections.map((section, i) => (
          <SectionForm
            key={i}
            section={section}
            onChange={(updated) => updateSection(i, updated)}
            onRemove={() => removeSection(i)}
          />
        ))}
        <Button type='dashed' onClick={addSection} style={{ width: '100%' }}>
          ➕ Bo‘lim qo‘shish
        </Button>
      </Space>
    </Card>
  );
}
