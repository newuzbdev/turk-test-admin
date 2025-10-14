import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, Banner, UpdateBanner } from "../../../utils/types/types";
import { bannerEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBanner) => {
      const { id, ...updateData } = data;
      const response = await axiosPrivate.patch<ApiResponse<Banner>>(
        bannerEndpoints.one(id),
        updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [bannerEndpoints.all] });
      toast.success("Banner muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      console.error("Banner update error:", error);
      const msg = error?.response?.data?.error || "Banner yangilashda xatolik yuz berdi";
      toast.error(msg);
    },
  });
};


