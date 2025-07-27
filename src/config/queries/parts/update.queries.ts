import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partsEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, Part } from "@/utils/types/types";

export const useUpdatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Part>) =>
      (
        await axiosPrivate.patch<ApiResponse<Part>>(
          partsEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [partsEndpoints.all] });
      toast.success("Muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Yangilashda xatolik yuz berdi");
    },
  });
};
