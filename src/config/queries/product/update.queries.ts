import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, Product, UpdateProduct } from "../../../utils/types/types";
import { productEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProduct) => {
      const { id, ...updateData } = data;
      const response = await axiosPrivate.patch<ApiResponse<Product>>(
        productEndpoints.one(id),
        updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [productEndpoints.all] });
      toast.success("Mahsulot muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      console.error("Product update error:", error);
      const msg = error?.response?.data?.error || "Mahsulot yangilashda xatolik yuz berdi";
      toast.error(msg);
    },
  });
};


