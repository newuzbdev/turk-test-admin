import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "../../api";
import {
  listeningEndpoints,
  readingEndpoints,
  testEndpoints,
} from "../../endpoint";
import { describePublicationIssue } from "@/shared/components/mock-publication-readiness";
import type { MockPublicationIssue } from "@/utils/types/types";

type PublicationErrorBody = {
  issues?: MockPublicationIssue[];
  response?: { issues?: MockPublicationIssue[] };
  error?: { issues?: MockPublicationIssue[] };
  data?: { issues?: MockPublicationIssue[] };
};

export type ListeningTranscriptAlignmentSummary = {
  testId: string;
  model: string;
  requestId?: string;
  totalSentences: number;
  alignedSentences: number;
  totalEvidence: number;
  alignedEvidence: number;
  cached?: boolean;
  sections: Array<{
    sectionId: string;
    partNumber: number;
    totalSentences: number;
    alignedSentences: number;
    totalEvidence: number;
    alignedEvidence: number;
    confidence: number;
    reviewSegment?: {
      text: string;
      audioStartMs: number;
      audioEndMs: number;
      confidence: number;
    } | null;
  }>;
};

const invalidateMockLists = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return (
        key === testEndpoints.only ||
        key === listeningEndpoints.only ||
        key === readingEndpoints.only ||
        (typeof key === "string" && key.includes("/api/test"))
      );
    },
  });

const extractIssues = (error: unknown): MockPublicationIssue[] => {
  const body = (error as { response?: { data?: PublicationErrorBody } })
    ?.response?.data;
  const candidates = [
    body?.issues,
    body?.response?.issues,
    body?.error?.issues,
    body?.data?.issues,
  ];
  return candidates.find(Array.isArray) || [];
};

export const usePublishMockTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await axiosPrivate.patch(testEndpoints.publish(id))).data,
    onSuccess: () => {
      void invalidateMockLists(queryClient);
      toast.success("Test yayına alındı");
    },
    onError: (error: unknown) => {
      const issues = extractIssues(error);
      const detail = issues.slice(0, 3).map(describePublicationIssue).join(" · ");
      toast.error(detail || "Test yayına hazır değil");
    },
  });
};

export const useMoveMockTestToDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await axiosPrivate.patch(testEndpoints.moveToDraft(id))).data,
    onSuccess: () => {
      void invalidateMockLists(queryClient);
      toast.success("Test taslağa alındı");
    },
    onError: () => toast.error("Test taslağa alınamadı"),
  });
};

export const useAlignListeningTranscript = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (
        await axiosPrivate.post<ListeningTranscriptAlignmentSummary>(
          testEndpoints.alignListeningTranscript(id),
        )
      ).data,
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({
        queryKey: [testEndpoints.testAddition(id)],
      });
    },
    onError: (error: unknown) => {
      const response = (
        error as {
          response?: {
            data?: { message?: string; error?: string };
          };
        }
      ).response?.data;
      toast.error(
        response?.message ||
          response?.error ||
          "Cümle zamanları oluşturulamadı",
      );
    },
  });
};
