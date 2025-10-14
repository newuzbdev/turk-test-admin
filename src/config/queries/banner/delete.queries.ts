import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse } from "../../../utils/types/types";
import { bannerEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosPrivate.delete<ApiResponse<any>>(bannerEndpoints.one(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [bannerEndpoints.all] });
      toast.success("Banner muvaffaqiyatli o'chirildi");
    },
    onError: (error: any) => {
      console.error("Banner deletion error:", error);
      const msg = error?.response?.data?.error || "Banner o'chirishda xatolik yuz berdi";
      toast.error(msg);
    },
  });
};


