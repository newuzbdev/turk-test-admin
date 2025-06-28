import { Button, Form, Input } from "antd";
import { useAdminLogin } from "../../config/querys/login-querys";

export default function Login() {
    const [form] = Form.useForm();
    const loginMutation = useAdminLogin();

    const handleFinish = (values: { name: string; password: string }) => {
        loginMutation.mutate(values);
    };

    return (
        <Form form={form} onFinish={handleFinish} layout="vertical">
            <Form.Item name="name" label="Login" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="password" label="Parol" rules={[{ required: true }]}>
                <Input.Password />
            </Form.Item>
            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    // loading={loginMutation.isLoading}
                >
                    Kirish
                </Button>
            </Form.Item>
        </Form>
    );
}
