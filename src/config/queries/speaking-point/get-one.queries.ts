import axiosPrivate from "@/config/api";
import { speakingPointEndpoints } from "@/config/endpoint";
import type { ApiResponse, SpeakingPoint } from "@/utils/types/types";
import { useQuery } from "@tanstack/react-query";

export const useGetOneSpeakingPoint = (id: string) => {
  return useQuery({
    queryKey: [speakingPointEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingPoint>>(
          speakingPointEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};
