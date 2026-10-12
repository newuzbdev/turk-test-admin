import { Space, Tooltip, Typography } from "antd";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { StudentDevice } from "@/config/queries/students";
import { activityTime } from "./student-activity-summary";

const osNames = {
  WINDOWS: "Windows",
  MACOS: "Mac",
  IOS: "iOS",
  ANDROID: "Android",
  LINUX: "Linux",
  CHROME_OS: "ChromeOS",
  UNKNOWN: "",
};
const browsers = {
  CHROME: "Chrome",
  SAFARI: "Safari",
  EDGE: "Edge",
  FIREFOX: "Firefox",
  OPERA: "Opera",
  SAMSUNG: "Samsung Internet",
  UNKNOWN: "",
};
function label(device?: StudentDevice | null) {
  if (!device) return "Bilinmiyor";
  if (device.os === "IOS" && device.kind === "PHONE") return "iPhone";
  if (device.os === "IOS" && device.kind === "TABLET") return "iPad";
  const os = osNames[device.os] ?? "";
  const kind =
    { COMPUTER: "bilgisayar", PHONE: "telefon", TABLET: "tablet", UNKNOWN: "" }[
      device.kind
    ] ?? "";
  return [os, kind].filter(Boolean).join(" ") || "Bilinmiyor";
}
export default function StudentDeviceSummary({
  device,
  showTime = false,
}: {
  device?: StudentDevice | null;
  showTime?: boolean;
}) {
  const Icon =
    device?.kind === "PHONE"
      ? Smartphone
      : device?.kind === "TABLET"
        ? Tablet
        : device?.kind === "COMPUTER"
          ? Monitor
          : null;
  return (
    <Tooltip title="Tarayıcının bildirdiği yaklaşık cihaz bilgisi">
      <Space direction="vertical" size={0}>
        <Space size={6}>
          {Icon && <Icon size={15} aria-hidden />}
          <Typography.Text>{label(device)}</Typography.Text>
        </Space>
        {device && browsers[device.browser] && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {browsers[device.browser]}
          </Typography.Text>
        )}
        {showTime &&
          device &&
          Number.isFinite(Date.parse(device.observedAt)) && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {activityTime(device.observedAt)} (UTC+5)
            </Typography.Text>
          )}
      </Space>
    </Tooltip>
  );
}
