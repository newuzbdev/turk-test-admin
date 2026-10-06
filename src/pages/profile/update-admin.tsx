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
      <div className="admin-page">
        <Card style={{ maxWidth: 480 }}>
          <p>Oturum bulunamadı. Yeniden giriş yapın.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Title level={2} style={{ marginBottom: 24 }}>
        Hesap ayarları
      </Title>
      <Card style={{ maxWidth: 480 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          size="large"
          autoComplete="off"
        >
          <Form.Item name="name" label="Kullanıcı adı">
            <Input
              prefix={<UserOutlined />}
              placeholder="Yeni kullanıcı adı"
            />
          </Form.Item>
          <Form.Item
            name="oldPassword"
            label="Mevcut parola"
            rules={[
              {
                message: "Parolayı değiştirmek için mevcut parola gerekli",
                validator: (_, value) => {
                  const newP = form.getFieldValue("newPassword");
                  if (newP && !value) return Promise.reject(new Error("Mevcut parolanızı girin"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              prefix={<LockOutlined />}
              type={showOldPassword ? "text" : "password"}
              placeholder="Mevcut parola"
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
            label="Yeni parola"
            rules={[
              {
                min: 4,
                message: "Parola en az 4 karakter olmalı",
              },
            ]}
          >
            <Input
              prefix={<LockOutlined />}
              type={showNewPassword ? "text" : "password"}
              placeholder="Yeni parola"
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
              Güncelle
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
