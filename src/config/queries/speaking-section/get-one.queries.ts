import axiosPrivate from "@/config/api";
import { speakingSectionEndpoints } from "@/config/endpoint";
import type { ApiResponse, SpeakingSection } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneSpeakingSection = (id: string) => {
  return useQuery({
    queryKey: [speakingSectionEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingSection>>(
          speakingSectionEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
