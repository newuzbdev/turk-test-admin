import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, Product } from "../../../utils/types/types";
import { productEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetOneProduct = (id: string) => {
  return useQuery({
    queryKey: [productEndpoints.one(id)],
    queryFn: async () => {
      const response = await axiosPrivate.get<ApiResponse<Product>>(productEndpoints.one(id));
      return response.data;
    },
    enabled: !!id,
  });
};


