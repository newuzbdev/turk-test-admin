import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, Banner, CreateBanner } from "../../../utils/types/types";
import { bannerEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBanner) => {
      const response = await axiosPrivate.post<ApiResponse<Banner>>(bannerEndpoints.all, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [bannerEndpoints.all] });
      toast.success("Banner muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      console.error("Banner creation error:", error);
      const msg = error?.response?.data?.error || "Banner yaratishda xatolik yuz berdi";
      toast.error(msg);
    },
  });
};


