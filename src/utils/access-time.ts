export type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};
export const defaultPlatformLimits = {
  MOCK_WRITING: 10,
  MOCK_SPEAKING: 10,
  PRACTICE_AI: 120,
} as const;
const offset = 5 * 60 * 60 * 1000;
export function toAccessUtc(parts: LocalDateTime): string {
  const { year, month, day, hour, minute } = parts;
  if (
    !Object.values(parts).every(Number.isInteger) ||
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  )
    throw new RangeError("Geçersiz tarih/saat");
  const local = new Date(0);
  local.setUTCFullYear(year, month - 1, day);
  local.setUTCHours(hour, minute, 0, 0);
  if (
    local.getUTCFullYear() !== year ||
    local.getUTCMonth() !== month - 1 ||
    local.getUTCDate() !== day
  )
    throw new RangeError("Geçersiz takvim tarihi");
  return new Date(local.getTime() - offset).toISOString();
}
export function fromAccessUtc(iso: string): LocalDateTime {
  const date = new Date(new Date(iso).getTime() + offset);
  if (!Number.isFinite(date.getTime())) throw new RangeError("Geçersiz tarih");
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}
export function localAccessInput(iso: string): string {
  const p = fromAccessUtc(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(p.year).padStart(4, "0")}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
export function parseAccessInput(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new RangeError("Tarih ve saat gerekli");
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  return toAccessUtc({ year, month, day, hour, minute });
}

export type AccessWindowValue = { startsAt: string; endsAt: string };
export function initialAccessWindow(): AccessWindowValue {
  const now = new Date();
  now.setUTCSeconds(0, 0);
  return {
    startsAt: now.toISOString(),
    endsAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
  };
}
