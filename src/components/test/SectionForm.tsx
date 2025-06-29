import { Input, Button, Space, Typography } from 'antd';
import QuestionForm from './QuestionForm';
import type { TestQuestionDto, TestSectionDto } from '../../config/querys/test-query';

const { Title } = Typography;

type Props = {
  section: TestSectionDto;
  onChange: (section: TestSectionDto) => void;
  onRemove: () => void;
};

export default function SectionForm({ section, onChange, onRemove }: Props) {
  const updateQuestion = (index: number, updated: TestQuestionDto) => {
    const newQuestions = [...section.questions];
    newQuestions[index] = updated;
    onChange({ ...section, questions: newQuestions });
  };

  const addQuestion = () => {
    const newQuestion: TestQuestionDto = {
      number: section.questions.length + 1,
      type: 'MULTIPLE_CHOICE',
      text: '',
      answers: [],
    };
    onChange({ ...section, questions: [...section.questions, newQuestion] });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = section.questions.filter((_, i) => i !== index);
    onChange({ ...section, questions: newQuestions });
  };

  return (
    <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <Space direction='vertical' style={{ width: '100%' }}>
        <Title level={4}>Bo‘lim</Title>

        <Input
          placeholder='Sarlavha'
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
        />

        <Input
          placeholder='Kontent'
          value={section.content}
          onChange={(e) => onChange({ ...section, content: e.target.value })}
        />

        <Input
          placeholder='Rasm URL'
          value={section.imageUrl}
          onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
        />

        <div>
          <Title level={5}>Savollar</Title>
          {section.questions.map((q, i) => (
            <QuestionForm
              key={i}
              question={q}
              onChange={(updated) => updateQuestion(i, updated)}
              onRemove={() => removeQuestion(i)}
            />
          ))}
          <Button type='dashed' onClick={addQuestion}>+ Savol qo‘shish</Button>
        </div>

        <Button danger type='text' onClick={onRemove}>❌ Bo‘limni o‘chirish</Button>
      </Space>
    </div>
  );
}
