import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { useAdminLogin } from '../../config/querys/login-querys';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/auth-provider';

export default function Login() {
    const [form] = Form.useForm();
    const loginMutation = useAdminLogin();
    const navigate = useNavigate();
    const { setAuthenticated } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const handleFinish = (values: { name: string; password: string }) => {
        setError(null);
        loginMutation.mutate(values, {
            onSuccess: (data) => {
                localStorage.setItem('accessToken', data.accessToken);
                setAuthenticated(true);
                navigate('/listening');
            },
            onError: () => {
                setError('Login yoki parol noto‘g‘ri');
            }
        });
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 px-4">
            <Card
                className="w-full max-w-md shadow-xl"
                title={<Typography.Title level={3}>Admin Panelga Kirish</Typography.Title>}
                bordered={false}
            >
                {error && (
                    <Alert message={error} type="error" showIcon className="mb-4" />
                )}

                <Form
                    form={form}
                    onFinish={handleFinish}
                    layout="vertical"
                    size="middle"
                    autoComplete="off"
                >
                    <Form.Item
                        name="name"
                        label="Login"
                        rules={[{ required: true, message: 'Login kiriting' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Login"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Parol"
                        rules={[{ required: true, message: 'Parol kiriting' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Parol"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                        >
                            Kirish
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
