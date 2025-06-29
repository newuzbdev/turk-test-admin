import { Input, Button, Select, Typography } from 'antd';
import AnswerForm from './AnswerForm';
import type { TestAnswerDto, TestQuestionDto } from '../../config/querys/test-query';

const { Title } = Typography;

type Props = {  
    question: TestQuestionDto;
    onChange: (q: TestQuestionDto) => void;
    onRemove: () => void;
};

export default function QuestionForm({ question, onChange, onRemove }: Props) {
    const updateAnswer = (index: number, field: keyof TestAnswerDto, value: any) => {
        const newAnswers = [...question.answers];
        newAnswers[index] = { ...newAnswers[index], [field]: value };
        onChange({ ...question, answers: newAnswers });
    };

    const addAnswer = () => {
        onChange({ ...question, answers: [...question.answers, { variantText: '', answer: '', correct: false }] });
    };

    const removeAnswer = (index: number) => {
        const newAnswers = question.answers.filter((_, i) => i !== index);
        onChange({ ...question, answers: newAnswers });
    };

    return (
        <div style={{ marginBottom: 24, padding: 16, border: '1px dashed #ccc', borderRadius: 8 }}>
            <Title level={5}>Savol #{question.number}</Title>

            <Input
                placeholder='Savol matni'
                value={question.text}
                onChange={(e) => onChange({ ...question, text: e.target.value })}
                style={{ marginBottom: 8 }}
            />

            <Select
                value={question.type}
                onChange={(value) => onChange({ ...question, type: value })}
                style={{ width: 200, marginBottom: 8 }}
                options={[
                    { label: 'MULTIPLE_CHOICE', value: 'MULTIPLE_CHOICE' },
                    { label: 'GAP_FILL', value: 'GAP_FILL' },
                ]}
            />

            <div>
                {question.answers.map((a, i) => (
                    <AnswerForm
                        key={i}
                        answer={a}
                        onChange={(field, value) => updateAnswer(i, field, value)}
                        onRemove={() => removeAnswer(i)}
                    />
                ))}
                <Button type='dashed' onClick={addAnswer}>+ Javob qo‘shish</Button>
            </div>

            <Button danger type='text' onClick={onRemove}>❌ Savolni o‘chirish</Button>
        </div>
    );
}
