import type { StudentIdentity } from "@/config/queries/students";
export function registrationLocation(
  origin: StudentIdentity["registrationOrigin"],
) {
  if (!origin?.countryCode) return "—";
  let country = origin.countryCode;
  try {
    country =
      new Intl.DisplayNames(["tr"], { type: "region" }).of(
        origin.countryCode,
      ) ?? country;
  } catch {
    /* Display the two-letter code on older browsers. */
  }
  return [country, origin.city].filter(Boolean).join(" · ");
}
export function registrationMethodLabel(
  method: StudentIdentity["signupMethod"],
) {
  return {
    GOOGLE: "Google",
    TELEGRAM: "Telegram",
    LOCAL: "E-posta",
    UNKNOWN: "—",
  }[method ?? "UNKNOWN"];
}
export function registrationSourceLabel(
  origin: StudentIdentity["registrationOrigin"],
) {
  if (!origin || origin.source === "UNKNOWN") return "—";
  const name = {
    INSTAGRAM: "Instagram",
    TELEGRAM: "Telegram",
    GOOGLE: "Google",
    YOUTUBE: "YouTube",
    OTHER: "Diğer",
  }[origin.source];
  return origin.medium === "PAID"
    ? `${name} reklamı`
    : origin.source === "GOOGLE"
      ? "Google araması"
      : name;
}
