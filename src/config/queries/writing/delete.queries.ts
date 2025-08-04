import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse } from "../../../utils/types/types";
import { writingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteWritingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return (
        await axiosPrivate.delete<ApiResponse<null>>(
          writingTestEndpoints.one(id)
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing test muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Writing test o'chirishda xatolik yuz berdi");
    },
  });
};
