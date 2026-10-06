import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { aiCostEndpoints } from "@/config/endpoint";

export type AiCostAggregate = {
  requestCount: number;
  providerCallCount: number;
  successCount: number;
  failedCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageLatencyMs: number | null;
  unpricedRequestCount: number;
  estimatedCostUsd: number | null;
  coinCostCharged: number;
};

export type AiCostRecentRequest = {
  id: string;
  createdAt: string;
  feature: string;
  provider: string;
  model: string;
  status: "SUCCESS" | "FAILED" | "DENIED" | "FALLBACK";
  providerCallCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number | null;
  estimatedCostUsd: number | null;
  isRetry: boolean;
  errorCode: string | null;
};

export type AiCostRecentTest = {
  overallTestId: string;
  completedAt: string;
  userId: string;
  userLabel: string;
  sections: Array<"LISTENING" | "READING" | "WRITING" | "SPEAKING">;
  providerCallCount: number;
  geminiCostUsd: number | null;
  openAiCostUsd: number;
  deepgramCostUsd: number;
  totalCostUsd: number | null;
  costStatus: "VERIFIED" | "INCOMPLETE";
  missingCostCount: number;
};

export type AiCostSummary = {
  from: string;
  to: string;
  totalEstimatedCostUsd: number | null;
  totalOpenAiEstimatedCostUsd: number | null;
  totalGeminiEstimatedCostUsd: number | null;
  totalDeepgramEstimatedCostUsd: number | null;
  totalCoinCostCharged: number;
  requestCount: number;
  providerCallCount: number;
  successCount: number;
  failedCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageLatencyMs: number | null;
  unpricedRequestCount: number;
  byFeature: Record<string, AiCostAggregate>;
  byProvider: Record<string, AiCostAggregate>;
  byModel: Record<string, AiCostAggregate>;
  recentRequests: AiCostRecentRequest[];
  recentTests: AiCostRecentTest[];
  topUsersByEstimatedCost: Array<{
    userId: string;
    requestCount: number;
    estimatedCostUsd: number | null;
    coinCostCharged: number;
  }>;
  note: string;
};

export const useAiCostSummary = (from: string, to: string, label: string) =>
  useQuery({
    queryKey: ["ai-cost-summary", label, from, to],
    queryFn: async () => {
      const response = await axiosPrivate.get<AiCostSummary>(
        aiCostEndpoints.summary,
        { params: { from, to } }
      );
      return response.data;
    },
  });
