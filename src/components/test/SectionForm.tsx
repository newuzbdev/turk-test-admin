import { Button, Card, Col, Divider, Input, Row, Space, Typography } from 'antd';
import AnswerForm from './AnswerForm';
import type { TestQuestionDto, TestSectionDto, TestAnswerDto } from '../../config/querys/test-query';

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

  const updateAnswer = (qIndex: number, aIndex: number, updated: TestAnswerDto) => {
    const questions = [...section.questions];
    const answers = [...questions[qIndex].answers];
    answers[aIndex] = updated;
    questions[qIndex].answers = answers;
    onChange({ ...section, questions });
  };

  const addAnswer = (qIndex: number) => {
    const questions = [...section.questions];
    questions[qIndex].answers.push({ answer: '', correct: false, variantText: '' });
    onChange({ ...section, questions });
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const questions = [...section.questions];
    questions[qIndex].answers = questions[qIndex].answers.filter((_, i) => i !== aIndex);
    onChange({ ...section, questions });
  };

  return (
    <Card
      title="📖 Bo‘lim"
      extra={<Button danger type='text' onClick={onRemove}>🗑 O‘chirish</Button>}
      style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 6 }}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Input
            placeholder='Sarlavha'
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
          />
        </Col>
        <Col span={8}>
          <Input
            placeholder='Rasm URL'
            value={section.imageUrl}
            onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
          />
        </Col>
        <Col span={8}>
          <Input.TextArea
            placeholder='Content (matn)'
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
        </Col>
      </Row>

      <Divider orientation='left' style={{ marginTop: 20 }}>❓ Savollar</Divider>

      <Space direction='vertical' style={{ width: '100%' }}>
        {section.questions.map((q, qIdx) => (
          <Card
            key={qIdx}
            type='inner'
            title={`Savol #${q.number}`}
            extra={<Button danger type='text' onClick={() => removeQuestion(qIdx)}>🗑 O‘chirish</Button>}
          >
            <Input
              placeholder='Savol matni'
              value={q.text}
              onChange={(e) => updateQuestion(qIdx, { ...q, text: e.target.value })}
              style={{ marginBottom: 12 }}
            />

            {q.answers.map((a, aIdx) => (
              <AnswerForm
                key={aIdx}
                answer={a}
                onChange={(field, value) => {
                  const updated = { ...a, [field]: value };
                  updateAnswer(qIdx, aIdx, updated);
                }}
                onRemove={() => removeAnswer(qIdx, aIdx)}
              />
            ))}

            <Button type='dashed' onClick={() => addAnswer(qIdx)} block>
              ➕ Javob qo‘shish
            </Button>
          </Card>
        ))}

        <Button type='dashed' onClick={addQuestion} block>
          ➕ Savol qo‘shish
        </Button>
      </Space>
    </Card>
  );
}
