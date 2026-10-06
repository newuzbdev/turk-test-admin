import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { readingPracticeEndpoints } from "@/config/endpoint";

export const useGetOneReadingPractice = (id?: string) => {
  return useQuery({
    queryKey: [readingPracticeEndpoints.adminOne(id || ""), id],
    queryFn: async () => {
      const response = await axiosPrivate.get(
        readingPracticeEndpoints.adminOne(id || "")
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
  });
};
