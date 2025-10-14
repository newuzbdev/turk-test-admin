import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse } from "../../../utils/types/types";
import { productEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosPrivate.delete<ApiResponse<any>>(productEndpoints.one(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [productEndpoints.all] });
      toast.success("Mahsulot muvaffaqiyatli o'chirildi");
    },
    onError: (error: any) => {
      console.error("Product deletion error:", error);
      const msg = error?.response?.data?.error || "Mahsulot o'chirishda xatolik yuz berdi";
      toast.error(msg);
    },
  });
};


