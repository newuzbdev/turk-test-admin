import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse } from "../../../utils/types/types";
import { readingEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteReadingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return (
        await axiosPrivate.delete<ApiResponse<null>>(readingEndpoints.one(id))
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [readingEndpoints.all] });
      toast.success("Reading test muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Reading test o'chirishda xatolik yuz berdi");
    },
  });
};
