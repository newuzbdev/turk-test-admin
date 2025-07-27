import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partsEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, CreatePart, Part } from "@/utils/types/types";

export const useCreatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePart) =>
      (await axiosPrivate.post<ApiResponse<Part>>(partsEndpoints.all, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [partsEndpoints.all] });
      toast.success("Muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Yaratishda xatolik yuz berdi");
    },
  });
};
