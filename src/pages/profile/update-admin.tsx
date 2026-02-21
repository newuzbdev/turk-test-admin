import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography } from "antd";
import { useUpdateAdmin } from "@/config/queries/login-querys";
import { getAdminIdFromToken } from "@/utils/auth";
import { useState } from "react";

const { Title } = Typography;

export default function UpdateAdminPage() {
  const id = getAdminIdFromToken();
  const [form] = Form.useForm();
  const updateMutation = useUpdateAdmin();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleFinish = (values: { name?: string; oldPassword?: string; newPassword?: string }) => {
    if (!id) return;
    const body: { name?: string; oldPassword?: string; newPassword?: string } = {};
    if (values.name?.trim()) body.name = values.name.trim();
    if (values.oldPassword) body.oldPassword = values.oldPassword;
    if (values.newPassword) body.newPassword = values.newPassword;
    updateMutation.mutate(
      { id, ...body },
      {
        onSuccess: () => form.resetFields(),
      }
    );
  };

  if (!id) {
    return (
      <div style={{ padding: 24 }}>
        <Card style={{ maxWidth: 480 }}>
          <p>Admin ID topilmadi. Tizimga qayta kiring.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Parolni yangilash
      </Title>
      <Card style={{ maxWidth: 480 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          size="large"
          autoComplete="off"
        >
          <Form.Item name="name" label="Username">
            <Input
              prefix={<UserOutlined />}
              placeholder="Yangi username"
            />
          </Form.Item>
          <Form.Item
            name="oldPassword"
            label="Eski parol"
            rules={[
              {
                message: "Parolni o‘zgartirish uchun eski parol kerak",
                validator: (_, value) => {
                  const newP = form.getFieldValue("newPassword");
                  if (newP && !value) return Promise.reject(new Error("Eski parol kiritilishi shart"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              prefix={<LockOutlined />}
              type={showOldPassword ? "text" : "password"}
              placeholder="Eski parol"
              suffix={
                <span
                  onClick={() => setShowOldPassword((p) => !p)}
                  style={{ cursor: "pointer" }}
                >
                  {showOldPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </span>
              }
            />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Yangi parol"
            rules={[
              {
                min: 4,
                message: "Parol kamida 4 ta belgidan iborat bo‘lishi kerak",
              },
            ]}
          >
            <Input
              prefix={<LockOutlined />}
              type={showNewPassword ? "text" : "password"}
              placeholder="Yangi parol"
              suffix={
                <span
                  onClick={() => setShowNewPassword((p) => !p)}
                  style={{ cursor: "pointer" }}
                >
                  {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </span>
              }
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
              block
            >
              Yangilash
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
