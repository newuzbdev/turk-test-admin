import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { RequestIntent } from "@/components/access/access-form-state";
import { currentAdminId } from "./student-live-query";
import {
  subscriptionActionLabels,
  subscriptionTime,
  writeStudentSubscription,
} from "./student-subscription-query";
import type {
  StudentSubscriptionAction,
  StudentSubscriptionPayload,
  StudentSubscriptionState,
} from "./student-subscription-query";

type Fields = {
  reason: string;
  confirmed: boolean;
  days: number;
  writingMock: number;
  speakingMock: number;
  practiceAi: number;
};
const quotaFields = [
  { name: "writingMock", label: "Yazma Mock hakkı", bucket: "MOCK_WRITING" },
  {
    name: "speakingMock",
    label: "Konuşma Mock hakkı",
    bucket: "MOCK_SPEAKING",
  },
  { name: "practiceAi", label: "AI pratik hakkı", bucket: "PRACTICE_AI" },
] as const;
function errorStatus(error: unknown) {
  return (error as { response?: { status?: number } })?.response?.status;
}
function saveError(error: unknown) {
  if (errorStatus(error) === 403)
    return "Bu işlem için yönetici yetkisi gerekiyor.";
  if (errorStatus(error) === 401)
    return "Yönetici oturumu sona erdi. Yeniden giriş yapın.";
  if (errorStatus(error) === 400)
    return "İşlem bilgileri kabul edilmedi. Alanları kontrol edin.";
  return "İşlem sonucu doğrulanamadı. Aynı bilgilerle yeniden denemek işlemi tekrar uygulamaz.";
}
function integerRule(min: number, max: number, message: string) {
  return {
    validator: (_: unknown, value: unknown) =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= min &&
      value <= max
        ? Promise.resolve()
        : Promise.reject(new Error(message)),
  };
}
export default function StudentSubscriptionDialog({
  userId,
  adminId,
  state,
  action,
  onClose,
  onSuccess,
  onReload,
}: {
  userId: string;
  adminId: string;
  state: StudentSubscriptionState;
  action: StudentSubscriptionAction;
  onClose: () => void;
  onSuccess: (state: StudentSubscriptionState) => Promise<void>;
  onReload: () => Promise<void>;
}) {
  const [form] = Form.useForm<Fields>();
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState("");
  const intent = useRef(new RequestIntent());
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const days = Form.useWatch("days", form) ?? state.plan.periodDays;
  const writing = Form.useWatch("writingMock", form) ?? 0;
  const speaking = Form.useWatch("speakingMock", form) ?? 0;
  const practice = Form.useWatch("practiceAi", form) ?? 0;
  const title =
    action === "RENEW" && !state.subscription
      ? "Üyeliği başlat"
      : subscriptionActionLabels[action];
  const quotaAction = action === "ADD_QUOTA" || action === "REDUCE_QUOTA";
  const destructive = action === "CANCEL" || action === "REDUCE_QUOTA";
  const sameSession = () => mounted.current && currentAdminId() === adminId;

  async function save() {
    if (locked.current || conflict || !sameSession()) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      let fields: Fields;
      try {
        fields = await form.validateFields();
      } catch {
        return;
      }
      if (
        quotaAction &&
        fields.writingMock + fields.speakingMock + fields.practiceAi <= 0
      ) {
        form.setFields([
          {
            name: "writingMock",
            errors: [
              action === "REDUCE_QUOTA"
                ? "En az bir hak azaltın."
                : "En az bir hak ekleyin.",
            ],
          },
        ]);
        return;
      }
      const values: Omit<StudentSubscriptionPayload, "requestId"> = {
        expectedVersion: state.version,
        action,
        reason: fields.reason.trim(),
        confirmed: true,
        ...(action === "EXTEND" ? { days: fields.days } : {}),
        ...(quotaAction
          ? {
              writingMock: fields.writingMock,
              speakingMock: fields.speakingMock,
              practiceAi: fields.practiceAi,
            }
          : {}),
      };
      const payload = {
        ...values,
        requestId: intent.current.forPayload(values),
      };
      const updated = await writeStudentSubscription(userId, adminId, payload);
      if (!sameSession()) return;
      await onSuccess(updated);
      if (sameSession()) onClose();
    } catch (failure) {
      if (!sameSession()) return;
      if (errorStatus(failure) === 409) {
        setConflict(true);
        setError(
          "Üyelik bilgileri değişti. Güncel veriyi yükleyip işlemi yeniden açın.",
        );
      } else setError(saveError(failure));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function reload() {
    if (locked.current || !sameSession()) return;
    locked.current = true;
    setBusy(true);
    try {
      await onReload();
      if (sameSession()) onClose();
    } catch {
      if (sameSession())
        setError(
          "Güncel üyelik yüklenemedi. Yeniden yüklemeyi tekrar deneyin.",
        );
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const extensionEnd =
    state.subscription && Number.isInteger(days) && days >= 1 && days <= 365
      ? subscriptionTime(
          new Date(
            Date.parse(state.subscription.periodEnd) + days * 86_400_000,
          ).toISOString(),
        )
      : "—";
  return (
    <Modal
      open
      title={title}
      onCancel={() => {
        if (!locked.current) onClose();
      }}
      onOk={() => void save()}
      okText={
        action === "CANCEL"
          ? "Üyeliği iptal et"
          : action === "REDUCE_QUOTA"
            ? "Hakları azalt"
            : "İşlemi onayla"
      }
      cancelText="Vazgeç"
      confirmLoading={busy}
      okButtonProps={{ disabled: conflict, danger: destructive }}
      cancelButtonProps={{ disabled: busy }}
      closable={!busy}
      maskClosable={false}
      keyboard={!busy}
      width={560}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type={
            destructive || (action === "RENEW" && state.subscription)
              ? "warning"
              : "info"
          }
          showIcon
          message={
            action === "RENEW"
              ? `${state.plan.periodDays} günlük yeni üyelik dönemi şimdi başlar.`
              : action === "EXTEND"
                ? `Yeni bitiş (UTC+5): ${extensionEnd}`
                : action === "CANCEL"
                  ? "Üyelik erişimi şimdi kapanır."
                  : action === "REDUCE_QUOTA"
                    ? "Yalnız kalan haklar azaltılır."
                    : "Haklar mevcut üyelik dönemine eklenir."
          }
          description={
            action === "RENEW" ? (
              <>
                {state.subscription && (
                  <p>
                    Kullanılmamış üyelik günleri ve üyelik hakları yeni dönemle
                    değiştirilir.
                  </p>
                )}
                <p>
                  Yeni haklar: {state.plan.quotas.MOCK_WRITING} Yazma Mock ·{" "}
                  {state.plan.quotas.MOCK_SPEAKING} Konuşma Mock ·{" "}
                  {state.plan.quotas.PRACTICE_AI} AI pratik.
                </p>
              </>
            ) : action === "EXTEND" ? (
              "Mevcut bitiş tarihine gün eklenir; kalan haklar korunur."
            ) : action === "CANCEL" ? (
              "Geçmiş sınavlar ve kullanılmış hak kayıtları korunur."
            ) : (
              "Bitiş tarihi ve kullanılan haklar değişmez."
            )
          }
        />
        <Typography.Text type="secondary">
          {action === "CANCEL"
            ? "Para iadesi yapılmaz."
            : "Payme üzerinden ödeme alınmaz."}{" "}
          Hediye erişimler ve satın alınan ek haklar korunur.
        </Typography.Text>
        {quotaAction && (
          <Table
            size="small"
            pagination={false}
            rowKey="bucket"
            dataSource={quotaFields.map((field, index) => {
              const current =
                state.subscription?.quotas[field.bucket].remaining ?? 0;
              const amount = [writing, speaking, practice][index];
              const next =
                current + (action === "REDUCE_QUOTA" ? -amount : amount);
              return {
                ...field,
                current,
                next: Number.isInteger(next) && next >= 0 ? next : null,
              };
            })}
            columns={[
              { title: "Hak", dataIndex: "label" },
              { title: "Şimdi", dataIndex: "current", align: "right" },
              {
                title: "İşlem sonrası",
                dataIndex: "next",
                align: "right",
                render: (value) => (
                  <Typography.Text strong>{value ?? "—"}</Typography.Text>
                ),
              },
            ]}
          />
        )}
        {error && (
          <Alert
            role="alert"
            type="error"
            message={error}
            action={
              conflict && (
                <Button loading={busy} onClick={() => void reload()}>
                  Yeniden yükle
                </Button>
              )
            }
          />
        )}
        <Form
          form={form}
          layout="vertical"
          disabled={busy || conflict}
          initialValues={{
            days: state.plan.periodDays,
            writingMock: 0,
            speakingMock: 0,
            practiceAi: 0,
            reason: "",
            confirmed: false,
          }}
          onValuesChange={() => {
            if (!conflict) setError("");
          }}
        >
          {action === "EXTEND" && (
            <Form.Item
              name="days"
              label="Eklenecek gün"
              required
              rules={[integerRule(1, 365, "1–365 arasında tam sayı girin.")]}
            >
              <InputNumber
                aria-label="Eklenecek gün"
                min={1}
                max={365}
                step={1}
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}
          {quotaAction &&
            quotaFields.map((field) => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                rules={[
                  integerRule(
                    0,
                    action === "REDUCE_QUOTA"
                      ? Math.min(
                          10000,
                          state.subscription?.quotas[field.bucket].remaining ??
                            0,
                        )
                      : 10000,
                    `0–${action === "REDUCE_QUOTA" ? Math.min(10000, state.subscription?.quotas[field.bucket].remaining ?? 0) : 10000} arasında tam sayı girin.`,
                  ),
                ]}
              >
                <InputNumber
                  aria-label={field.label}
                  min={0}
                  max={action === "REDUCE_QUOTA" ? undefined : 10000}
                  changeOnBlur={action !== "REDUCE_QUOTA"}
                  step={1}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            ))}
          <Form.Item
            name="reason"
            label="İşlem notu"
            required
            rules={[
              {
                validator: (_, value: string | undefined) => {
                  const length = value?.trim().length ?? 0;
                  return length >= 3 && length <= 500
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("En az 3 karakterlik işlem notu girin."),
                      );
                },
              },
            ]}
          >
            <Input.TextArea
              aria-label="İşlem notu"
              maxLength={500}
              rows={3}
              showCount
              placeholder="Bu düzenlemenin nedenini yazın"
            />
          </Form.Item>
          <Form.Item
            name="confirmed"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value === true
                    ? Promise.resolve()
                    : Promise.reject(new Error("İşlemin etkisini onaylayın.")),
              },
            ]}
          >
            <Checkbox>İşlemin etkisini okudum ve onaylıyorum.</Checkbox>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}
