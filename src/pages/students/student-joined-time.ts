export function joinedTime(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Samarkand",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("day")}.${part("month")}.${part("year")} ${part("hour")}:${part("minute")}`;
}
