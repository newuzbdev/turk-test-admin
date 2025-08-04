import {
  LockOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { Button, Form, Input,  } from "antd";
import { useAdminLogin } from "../../config/queries/login-querys";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/auth-provider";

export default function Login() {
  const [form] = Form.useForm();
  const loginMutation = useAdminLogin();
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();
  const [, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="flex items-center justify-center w-[100vw] h-screen overflow-hidden">
      <div className="flex flex-col w-full max-w-2xl px-4 mx-auto sm:px-6">
        <div className="flex items-center justify-center space-x-2">
          <img
            src="./turk-test.png"
            alt="logo"
            className="object-contain h-[200px] w-[150px]"
          />
          {/* <div className="text-2xl font-bold leading-none text-slate-900 whitespace-nowrap">
            TURKCE TEST
          </div> */}
        </div>
        {/* <div className="relative  z-[1]">
          <h1 className="text-2xl font-medium tracking-tight text-center text-slate-900">
            Kirish
          </h1>
        </div> */}
        <div className="mx-2 z-[2] mt-10 flex-auto px-10 py-5 shadow-2xl shadow-slate-900/10 sm:mx-0 sm:flex-none sm:rounded-5xl sm:p-24 rounded-3xl w-full">
          <Form
            form={form}
            onFinish={handleFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="name"
              label="Username"
              rules={[
                { required: true, message: "Username kiritilishi shart" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Username kiriting"
                className="h-10"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Parol"
              rules={[
                { required: true, message: "Parol kiritilishi shart" },
                {
                  min: 4,
                  message: "Parol kamida 4 ta belgidan iborat bo'lishi kerak",
                },
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                type={showPassword ? "text" : "password"}
                placeholder="Parolni kiriting"
                className="h-10"
                suffix={
                  <div
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{ cursor: "pointer" }}
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </div>
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="h-10"
                style={{ backgroundColor: "#1677ff" }}
              >
                Kirish
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </main>
  );
}
