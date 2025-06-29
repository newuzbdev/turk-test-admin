import { Button, Card, Divider, Input, Row, Col, Typography } from 'antd';
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
        <Card bodyStyle={{ padding: 24 }}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Title level={4}>📋 Yangi Listening Test</Title>
                </Col>

                <Col span={12}>
                    <Input
                        placeholder='Test nomi'
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        size='large'
                    />
                </Col>

                <Col span={12}>
                    <Input
                        placeholder='IELTS ID'
                        value={formData.ieltsId}
                        onChange={(e) => setFormData({ ...formData, ieltsId: e.target.value })}
                        size='large'
                    />
                </Col>
            </Row>

            <Divider orientation='left' style={{ marginTop: 30 }}>🎧 Partlar</Divider>

            {formData.parts.map((part, i) => (
                <PartForm
                    key={i}
                    part={part}
                    onChange={(updated) => updatePart(i, updated)}
                    onRemove={() => removePart(i)}
                />
            ))}

            <Button type='dashed' onClick={addPart} style={{ width: '100%', marginTop: 16 }}>
                ➕ Part qo‘shish
            </Button>

            <Divider />

            <Button type='primary' block size='large' onClick={handleSubmit}>
                ✅ Testni Saqlash
            </Button>
        </Card>
    );
}
