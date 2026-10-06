import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { subscriptionEndpoints } from "@/config/endpoint";

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
  quotas: Record<"MOCK_WRITING" | "MOCK_SPEAKING" | "PRACTICE_AI", SubscriptionAllowance>;
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
  return useQuery({
    queryKey: ["admin-subscriptions", params],
    queryFn: async () => {
      const response = await axiosPrivate.get<AdminSubscriptionResponse>(
        subscriptionEndpoints.admin,
        {
          params: {
            page: params.page,
            limit: params.limit,
            status: params.status,
            search: params.search || undefined,
          },
        },
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
    retry: false,
  });
}
