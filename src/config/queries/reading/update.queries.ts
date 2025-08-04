import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, Test } from "../../../utils/types/types";
import { readingEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

interface UpdateReadingTestData {
  id: string;
  title: string;
  ieltsId: string;
  type: string;
}

export const useUpdateReadingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateReadingTestData) => {
      const { id, ...updateData } = data;
      return (
        await axiosPrivate.patch<ApiResponse<Test>>(
          readingEndpoints.one(id),
          updateData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [readingEndpoints.all] });
      toast.success("Reading test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Reading test yangilashda xatolik yuz berdi");
    },
  });
};
