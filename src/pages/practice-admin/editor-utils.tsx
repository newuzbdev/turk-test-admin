import { Typography } from "antd";

export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const createPracticeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `practice-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? value : [];

export function PracticeField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Typography.Text strong>{label}</Typography.Text>
      {children}
    </div>
  );
}
