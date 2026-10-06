import { Button, Input, InputNumber, Select, Space, Typography } from "antd";
import { useState } from "react";
import { localAccessInput, parseAccessInput } from "@/utils/access-time";
import type { AccessWindowValue } from "@/utils/access-time";
export default function AccessTimeWindow({
  value,
  onChange,
  onValidityChange,
}: {
  value: AccessWindowValue;
  onChange: (value: AccessWindowValue) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const [duration, setDuration] = useState(1);
  const [unit, setUnit] = useState(3600000);
  const [error, setError] = useState("");
  const extend = (ms: number) => {
    setError("");
    onValidityChange?.(true);
    onChange({
      ...value,
      endsAt: new Date(new Date(value.startsAt).getTime() + ms).toISOString(),
    });
  };
  const change = (field: keyof AccessWindowValue, text: string) => {
    try {
      const iso = parseAccessInput(text);
      onChange({ ...value, [field]: iso });
      setError("");
      onValidityChange?.(true);
    } catch {
      setError("Geçerli tarih ve saat girin.");
      onValidityChange?.(false);
    }
  };
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Typography.Text>Özbekistan saati (UTC+5)</Typography.Text>
      <label>
        Başlangıç
        <Input
          aria-label="Başlangıç"
          type="datetime-local"
          min="0001-01-01T00:00"
          max="9999-12-31T23:59"
          value={localAccessInput(value.startsAt)}
          onChange={(e) => change("startsAt", e.target.value)}
        />
      </label>
      <label>
        Bitiş
        <Input
          aria-label="Bitiş"
          type="datetime-local"
          value={localAccessInput(value.endsAt)}
          onChange={(e) => change("endsAt", e.target.value)}
        />
      </label>
      <Space wrap>
        {[
          [1, "1 saat"],
          [24, "24 saat"],
          [72, "72 saat"],
          [720, "30 gün"],
        ].map(([hours, label]) => (
          <Button key={hours} onClick={() => extend(Number(hours) * 3600000)}>
            {label}
          </Button>
        ))}
      </Space>
      <Space>
        <InputNumber
          aria-label="Özel süre"
          min={1}
          max={876000}
          value={duration}
          onChange={(n) => setDuration(n ?? 1)}
        />
        <Select
          aria-label="Süre birimi"
          value={unit}
          onChange={setUnit}
          options={[
            { value: 3600000, label: "Saat" },
            { value: 86400000, label: "Gün" },
          ]}
        />
        <Button onClick={() => extend(duration * unit)}>Süreyi uygula</Button>
      </Space>
      {error && <Typography.Text type="danger">{error}</Typography.Text>}
    </Space>
  );
}
