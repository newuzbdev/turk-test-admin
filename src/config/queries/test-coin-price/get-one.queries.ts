import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { testCoinPriceEndpoints } from "@/config/endpoint";

export const useGetOneTestCoinPrice = (id: string) => {
  return useQuery({
    queryKey: [testCoinPriceEndpoints.one(id)],
    queryFn: async () => {
      const response = await axiosPrivate.get(testCoinPriceEndpoints.one(id));
      return response.data;
    },
    enabled: !!id,
  });
};



