import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { subscriptionEndpoints } from "@/config/endpoint";
import {
  adminSubscriptionGet,
  useSubscriptionAdminId,
} from "@/pages/students/student-subscription-query";

export type SubscriptionListStatus = "ALL" | "ACTIVE" | "EXPIRED";

export type SubscriptionConfig = {
  billingMode: "coin" | "subscription";
  plan: {
    periodDays: number;
    baseMonthlyPriceUzs: number;
    includedAssessmentUnits: number;
    quotas: Record<"MOCK_WRITING" | "MOCK_SPEAKING" | "PRACTICE_AI", number>;
    extraAssessmentUnitPriceUzs: number;
    addOnAssessmentUnitPriceUzs: number;
    maxMonthlyAssessmentUnits: number;
    maxAddOnAssessmentUnits: number;
  };
};

export type SubscriptionAllowance = {
  granted: number;
  used: number;
  remaining: number;
};

export type AdminSubscriptionRow = {
  id: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    phoneNumber: string | null;
    telegramId: string | null;
    telegramUsername: string | null;
  };
  status: "ACTIVE" | "EXPIRED";
  periodStart: string;
  periodEnd: string;
  includedAssessment: SubscriptionAllowance;
  quotas: Record<
    "MOCK_WRITING" | "MOCK_SPEAKING" | "PRACTICE_AI",
    SubscriptionAllowance
  >;
  addOnAssessment: SubscriptionAllowance & { frozen: boolean };
  totalAssessmentRemaining: number;
  lastOrder: {
    kind: "MONTHLY" | "ADD_ON";
    amountUzs: number;
    assessmentUnits: number;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminSubscriptionResponse = {
  data: AdminSubscriptionRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function useSubscriptionConfig() {
  return useQuery({
    queryKey: ["subscription-config"],
    queryFn: async () => {
      const response = await axiosPrivate.get<SubscriptionConfig>(
        subscriptionEndpoints.config,
      );
      return response.data;
    },
    retry: false,
  });
}

export function useAdminSubscriptions(params: {
  page: number;
  limit: number;
  search: string;
  status: SubscriptionListStatus;
}) {
  const adminId = useSubscriptionAdminId();
  const client = useQueryClient();
  useEffect(() => {
    const legacy = (key: readonly unknown[]) =>
      key[0] === "admin-subscriptions" && key.length < 3;
    // Remove old persisted keys, including a restoration that finishes after mount.
    client.removeQueries({ predicate: (entry) => legacy(entry.queryKey) });
    return client.getQueryCache().subscribe((event) => {
      if (event.type === "added" && legacy(event.query.queryKey))
        client.removeQueries({ queryKey: event.query.queryKey, exact: true });
    });
  }, [client]);
  const query = useQuery({
    queryKey: ["admin-subscriptions", params, adminId],
    queryFn: ({ signal }) =>
      adminSubscriptionGet<AdminSubscriptionResponse>(
        subscriptionEndpoints.admin,
        adminId,
        signal,
        {
          page: params.page,
          limit: params.limit,
          status: params.status,
          search: params.search || undefined,
        },
      ),
    enabled: !!adminId,
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === adminId ? previous : undefined,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    meta: { persist: false },
  });
  return { ...query, data: adminId ? query.data : undefined };
}
