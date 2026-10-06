import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { isAxiosError } from "axios";

export function systemServicesErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401)
      return "Oturumun süresi dolmuş. Yeniden giriş yapıp deneyin.";
    if (status === 403)
      return "Bu sayfayı görüntülemek için yönetici yetkisi gerekiyor.";
    if (status === 404)
      return "Bağlı sunucuda servis listesi henüz bulunmuyor. Sunucunun güncel sürümle çalışması gerekiyor.";
    if (status && status >= 500)
      return "Sunucuya ulaşıldı ancak servis listesi hazırlanamadı. Yenile düğmesiyle tekrar deneyin.";
    if (!error.response)
      return "Sunucuya ulaşılamıyor. Bağlantı yeniden kurulduğunda Yenile düğmesiyle tekrar deneyin.";
  }
  return "Servis listesi yüklenemedi. Yenile düğmesiyle tekrar deneyin.";
}

export type ServiceCategory =
  | "ai"
  | "access"
  | "storage"
  | "payments"
  | "notifications"
  | "media"
  | "platform"
  | "legacy";
export type ServiceStatus =
  "configured" | "missing" | "disabled" | "internal" | "available";
export interface SystemServiceItem {
  id: string;
  name: string;
  provider: string;
  category: ServiceCategory;
  status: ServiceStatus;
  purpose: string;
  usedIn: string;
  detail: string;
  model?: string;
  location?: { label: string; address?: string };
}
export interface SystemServicesResponse {
  checkedAt: string;
  environment: "production" | "development" | "other";
  items: SystemServiceItem[];
}

export function useSystemServices() {
  return useQuery({
    queryKey: ["system-services"],
    queryFn: async () =>
      (
        await axiosPrivate.get<SystemServicesResponse>(
          "/api/admin/system-services/overview",
        )
      ).data,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}
