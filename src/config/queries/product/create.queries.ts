import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, Product, CreateProduct } from "../../../utils/types/types";
import { productEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProduct) => {
      const response = await axiosPrivate.post<ApiResponse<Product>>(productEndpoints.all, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [productEndpoints.all] });
      toast.success("Mahsulot muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      console.error("Product creation error:", error);
      const msg = error?.response?.data?.error || "Mahsulot yaratishda xatolik yuz berdi";
      toast.error(msg);
    },
  });
};


