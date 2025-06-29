import { Input, Checkbox, Button, Col, Row } from 'antd';
import type { TestAnswerDto } from '../../config/querys/test-query';

type Props = {
    answer: TestAnswerDto;
    onChange: (field: keyof TestAnswerDto, value: any) => void;
    onRemove: () => void;
};

export default function AnswerForm({ answer, onChange, onRemove }: Props) {
    return (
        <Row gutter={8} style={{ marginBottom: 8 }}>
            <Col span={4}>
                <Input
                    placeholder='Variant (A, B, ...)'
                    value={answer.variantText}
                    onChange={(e) => onChange('variantText', e.target.value)}
                />
            </Col>
            <Col span={16}>
                <Input
                    placeholder='Javob matni'
                    value={answer.answer}
                    onChange={(e) => onChange('answer', e.target.value)}
                />
            </Col>
            <Col span={2}>
                <Checkbox
                    checked={answer.correct}
                    onChange={(e) => onChange('correct', e.target.checked)}
                >
                    ✅
                </Checkbox>
            </Col>
            <Col span={2}>
                <Button danger onClick={onRemove}>
                    🗑
                </Button>
            </Col>
        </Row>
    );
}
