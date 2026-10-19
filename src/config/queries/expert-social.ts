import { useQuery } from '@tanstack/react-query';
import axiosPrivate from '@/config/api';

export type ExpertSocialPeriod = 'all' | 'today' | '7d' | '30d';
export type ExpertSocialSummary = {
  period: ExpertSocialPeriod;
  from: string | null;
  to: string;
  timezone: string;
  total: number;
  items: { expertId: string; name: string; telegram: number; instagram: number | null; total: number }[];
};

export function useExpertSocialSummary(period: ExpertSocialPeriod) {
  return useQuery({
    queryKey: ['expert-social-summary', period],
    queryFn: async () => (await axiosPrivate.get<ExpertSocialSummary>('/api/admin/expert-social/summary', { params: { period } })).data,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}
