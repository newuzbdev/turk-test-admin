import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { billingPackageEndpoints as ep } from "@/config/endpoint";
import type {
  PackageDraft,
  PackageTerms,
  ContentOptions,
} from "@/pages/billing-packages/billing-package-form";
export type BillingSettings = {
  revision: number;
  lessonsVisible: boolean;
  defaultPackageId: string;
};
export type BillingHistory = {
  id: string;
  actorId: string;
  action: string;
  createdAt: string;
  before: unknown;
  after: unknown;
};
const get = async <T>(url: string) => (await axiosPrivate.get<T>(url)).data;
export const billingApi = {
  list: () => get<PackageDraft[]>(ep.packages),
  content: () => get<ContentOptions>(ep.content),
  settings: () => get<BillingSettings>(ep.settings),
  get: (id: string) => get<PackageDraft>(ep.one(id)),
  history: (id: string) => get<BillingHistory[]>(ep.history(id)),
  create: async (terms: PackageTerms) =>
    (await axiosPrivate.post<PackageDraft>(ep.packages, { terms })).data,
  save: async (draft: PackageDraft, terms: PackageTerms) =>
    (
      await axiosPrivate.patch<PackageDraft>(ep.one(draft.id), {
        terms,
        expectedRevision: draft.revision,
      })
    ).data,
  publish: async (draft: PackageDraft) => {
    await axiosPrivate.post(ep.publish(draft.id), {
      expectedRevision: draft.revision,
      requestId: crypto.randomUUID(),
    });
    return get<PackageDraft>(ep.one(draft.id));
  },
  sales: async (draft: PackageDraft) =>
    (
      await axiosPrivate.patch<PackageDraft>(ep.sales(draft.id), {
        expectedRevision: draft.revision,
        enabled: !draft.salesEnabled,
      })
    ).data,
  sort: async (draft: PackageDraft, sortOrder: number) =>
    (
      await axiosPrivate.patch<PackageDraft>(ep.sort(draft.id), {
        expectedRevision: draft.revision,
        sortOrder,
      })
    ).data,
  saveSettings: async (settings: BillingSettings) =>
    (
      await axiosPrivate.patch<BillingSettings>(ep.settings, {
        expectedRevision: settings.revision,
        lessonsVisible: settings.lessonsVisible,
        defaultPackageId: settings.defaultPackageId,
      })
    ).data,
};
export function useBillingPackages() {
  return useQuery({
    queryKey: ["billing-packages"],
    queryFn: billingApi.list,
    retry: false,
  });
}
export function useBillingCampaignState(id?: string) {
  return useQuery({
    queryKey: ["billing-package-campaign", id],
    queryFn: () => billingApi.get(id!),
    select: (draft) => draft.campaignState ?? null,
    enabled: !!id,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: false,
  });
}
export function useBillingContent() {
  return useQuery({
    queryKey: ["billing-content"],
    queryFn: billingApi.content,
    retry: false,
  });
}
export function useBillingSettings() {
  return useQuery({
    queryKey: ["billing-settings"],
    queryFn: billingApi.settings,
    retry: false,
  });
}
export function useBillingHistory(id?: string) {
  return useQuery({
    queryKey: ["billing-history", id],
    queryFn: () => billingApi.history(id!),
    enabled: !!id,
    retry: false,
  });
}
export function useBillingMutation<T, R>(fn: (input: T) => Promise<R>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["billing-packages"] }),
        client.invalidateQueries({ queryKey: ["billing-package-campaign"] }),
        client.invalidateQueries({ queryKey: ["billing-settings"] }),
        client.invalidateQueries({ queryKey: ["billing-history"] }),
        client.invalidateQueries({ queryKey: ["subscription-config"] }),
      ]),
  });
}
