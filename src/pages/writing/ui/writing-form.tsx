import { Form, Input, Button, Select } from "antd";
import type { WritingTest, WritingTestPayload } from "../../../config/querys/writing-query";
import { useGetIeltsList } from "../../../config/querys/Ielts-query";

type Props = {
    initialValues?: WritingTest;
    onSubmit: (values: WritingTestPayload) => void;
    onCancel: () => void;
};

export default function WritingForm({ initialValues, onSubmit, onCancel }: Props) {
    const [form] = Form.useForm();
    const { data, isLoading } = useGetIeltsList();

    const handleFinish = (values: any) => {
        onSubmit(values);
        form.resetFields();
    };

    return (
        <Form
            layout="vertical"
            form={form}
            onFinish={handleFinish}
            initialValues={initialValues}
        >
            <Form.Item name="title" label="Test nomi" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="task1Title" label="Task 1 sarlavhasi" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="task1" label="Task 1 matni" rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="task2Title" label="Task 2 sarlavhasi" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="task2" label="Task 2 matni" rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="instruction" label="Ko‘rsatma" rules={[{ required: true }]}>
                <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="ieltsId" label="IELTS ID" rules={[{ required: true }]}>
                <Select
                    placeholder="IELTS testni tanlang"
                    size="large"
                    style={{ width: "100%" }}
                    loading={isLoading}
                >
                    {data?.data?.map(
                        (test: { id: string | number; title: string }) => (
                            <Select.Option key={test.id} value={test.id}>
                                {test.title}
                            </Select.Option>
                        )
                    )}
                </Select>
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "end", gap: 8 }}>
                <Button onClick={onCancel}>Bekor qilish</Button>
                <Button type="primary" htmlType="submit">
                    Saqlash
                </Button>
            </div>
        </Form>
    );
}
