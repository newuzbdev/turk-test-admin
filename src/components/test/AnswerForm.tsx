import { Input, Checkbox, Space, Button } from 'antd';
import type { TestAnswerDto } from '../../config/querys/test-query';

type Props = {
    answer: TestAnswerDto;
    onChange: (field: keyof TestAnswerDto, value: any) => void;
    onRemove: () => void;
};

export default function AnswerForm({ answer, onChange, onRemove }: Props) {
    return (
        <Space style={{ display: 'flex', marginBottom: 8 }}>
            <Input
                placeholder='Variant (A, B, ...)' value={answer.variant}
                onChange={(e) => onChange('variant', e.target.value)}
            />
            <Input
                placeholder='Javob matni' value={answer.answer}
                onChange={(e) => onChange('answer', e.target.value)}
            />
            <Checkbox
                checked={answer.correct}
                onChange={(e) => onChange('correct', e.target.checked)}
            >To'g'ri</Checkbox>
            <Button danger onClick={onRemove}>O'chirish</Button>
        </Space>
    );
}
