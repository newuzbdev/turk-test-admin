import { useQuery } from "@tanstack/react-query";
import { productEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetAllProducts = () => {
  return useQuery({
    queryKey: [productEndpoints.all],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get(productEndpoints.all);
        console.log("Raw Product API response:", response);
        console.log("Product response data:", response.data);
        return response.data;
      } catch (error) {
        console.error("Product API Error:", error);
        throw error;
      }
    },
  });
};


