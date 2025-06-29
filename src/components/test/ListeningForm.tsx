import { Button, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import PartForm from './PartForm';
import type { CreateTestDto, TestPartDto } from '../../config/querys/test-query';


const { Title } = Typography;

type Props = {
  onSubmit: (data: CreateTestDto) => void;
  initialData?: CreateTestDto;
};

export default function ListeningForm({ onSubmit, initialData }: Props) {
  const [formData, setFormData] = useState<CreateTestDto>(
    initialData || {
      title: '',
      type: 'LISTENING',
      ieltsId: '',
      parts: [
        {
          number: 1,
          title: '',
          audioUrl: '',
          sections: [],
        },
      ],
    }
  );

  const updatePart = (index: number, updated: TestPartDto) => {
    const newParts = [...formData.parts];
    newParts[index] = updated;
    setFormData({ ...formData, parts: newParts });
  };

  const addPart = () => {
    const newPart: TestPartDto = {
      number: formData.parts.length + 1,
      title: '',
      audioUrl: '',
      sections: [],
    };
    setFormData({ ...formData, parts: [...formData.parts, newPart] });
  };

  const removePart = (index: number) => {
    const newParts = formData.parts.filter((_, i) => i !== index);
    setFormData({ ...formData, parts: newParts });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Title level={4}>Yangi Listening Test</Title>

      <Input
        placeholder='Test nomi'
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <Input
        placeholder='IELTS ID'
        value={formData.ieltsId}
        onChange={(e) => setFormData({ ...formData, ieltsId: e.target.value })}
      />

      <div>
        <Title level={4}>Partlar</Title>
        {formData.parts.map((part, i) => (
          <PartForm
            key={i}
            part={part}
            onChange={(updated) => updatePart(i, updated)}
            onRemove={() => removePart(i)}
          />
        ))}
        <Button type='dashed' onClick={addPart}>+ Part qo‘shish</Button>
      </div>

      <Button type='primary' onClick={handleSubmit}>✅ Saqlash</Button>
    </Space>
  );
}
