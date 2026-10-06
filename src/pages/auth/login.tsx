import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Form, Input } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdminLogin } from "../../config/queries/login-querys";
import { useAuth } from "../../providers/auth-provider";

export default function Login() {
  const [form] = Form.useForm();
  const loginMutation = useAdminLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticated } = useAuth();
  const [, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleFinish = (values: { name: string; password: string }) => {
    setError(null);
    loginMutation.mutate(values, {
      onSuccess: () => {
        setAuthenticated(true);
        const from = location.state?.from?.pathname || "/test";
        navigate(from, { replace: true });
      },
      onError: () => {
        setError("Kullanıcı adı veya parola yanlış");
      },
    });
  };

  return (
    <main className="admin-login">
      <section className="admin-login-intro">
        <img
          className="admin-login-brand"
          src="/logo11.svg"
          alt="TURKISHMOCK"
        />
        <div className="admin-login-message">
          <p className="admin-login-eyebrow">Yönetim alanı</p>
          <h1>İçeriği tek bir yerden yönetin.</h1>
          <p>
            Sınavları, soruları ve platform içeriklerini mevcut veri akışını
            bozmadan düzenleyin.
          </p>
        </div>
        <span className="admin-login-note">
          TurkishMock yerel geliştirme ortamı
        </span>
      </section>

      <section className="admin-login-panel">
        <div className="admin-login-form">
          <div className="admin-login-form-header">
            <h2>Oturum açın</h2>
            <p>Yönetim paneline erişmek için bilgilerinizi girin.</p>
          </div>
          <Form
            form={form}
            onFinish={handleFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="name"
              label="Kullanıcı adı"
              rules={[
                { required: true, message: "Kullanıcı adı gereklidir" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Kullanıcı adınızı girin"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Parola"
              rules={[
                { required: true, message: "Parola gereklidir" },
                {
                  min: 4,
                  message: "Parola en az 4 karakter olmalıdır",
                },
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                type={showPassword ? "text" : "password"}
                placeholder="Parolanızı girin"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="admin-icon-button"
                    aria-label={
                      showPassword ? "Parolayı gizle" : "Parolayı göster"
                    }
                    style={{ width: 28, height: 28 }}
                  >
                    {showPassword ? (
                      <EyeInvisibleOutlined />
                    ) : (
                      <EyeOutlined />
                    )}
                  </button>
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="admin-login-submit"
                loading={loginMutation.isPending}
              >
                Oturum aç
              </Button>
            </Form.Item>
          </Form>
        </div>
      </section>
    </main>
  );
}
