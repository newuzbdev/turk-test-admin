import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input, Alert } from "antd";
import { useAdminLogin } from "../../config/querys/login-querys";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/auth-provider";

export default function Login() {
  const [form] = Form.useForm();
  const loginMutation = useAdminLogin();
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleFinish = (values: { name: string; password: string }) => {
    setError(null);
    loginMutation.mutate(values, {
      onSuccess: () => {
        setAuthenticated(true);
        navigate("/listening");
      },
      onError: () => {
        setError("Login yoki parol noto'g'ri");
      },
    });
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-white px-4">
      <div
        className="w-full max-w-md shadow-2xl border-0 bg-white p-6"
        style={{ borderRadius: "16px" }}
      >
        {error && (
          <Alert message={error} type="error" showIcon className="mb-4" />
        )}

        <Form
          form={form}
          onFinish={handleFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label={<span className="text-slate-700">Login</span>}
            rules={[{ required: true, message: "Login kiriting" }]}
          >
            <Input
              prefix={<UserOutlined className="text-slate-400" />}
              placeholder="Login"
              className="rounded-lg border-slate-200 hover:border-slate-400 bg-white"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-slate-700">Parol</span>}
            rules={[{ required: true, message: "Parol kiriting" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="Parol"
              className="rounded-lg border-slate-200 hover:border-slate-400 bg-white"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="h-12 bg-slate-800 hover:bg-slate-700 rounded-lg text-lg"
            >
              Kirish
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
