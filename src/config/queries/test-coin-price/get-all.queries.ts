import { useQuery } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { testCoinPriceEndpoints } from "@/config/endpoint";

export const useGetAllTestCoinPrices = () => {
  return useQuery({
    queryKey: [testCoinPriceEndpoints.all],
    queryFn: async () => {
      const response = await axiosPrivate.get(testCoinPriceEndpoints.all);
      console.log("[TestCoinPrice] GET", testCoinPriceEndpoints.all, response);
      return response.data;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
};


