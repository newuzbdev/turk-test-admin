import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ApiResponse, Test } from "../../../utils/types/types";
import { testEndpoints, readingEndpoints } from "../../endpoint";
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
          testEndpoints.updateTestFullTree(id),
          updateData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [testEndpoints.all] });
      toast.success("Reading test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Reading test yangilashda xatolik yuz berdi");
    },
  });
};

export const useUpdateReadingTestWithAddition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) =>
      (
        await axiosPrivate.patch<ApiResponse<Test>>(
          testEndpoints.updateTestFullTree(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key[0] === readingEndpoints.all ||
            key[0] === testEndpoints.all ||
            (typeof key[0] === "string" && key[0].includes("/api/test"))
          );
        },
      });
    },
    onError: (error: any) => {
      console.error("API Error:", error.response?.data);
      toast.error(error.response?.data?.error || "Reading test yangilashda xatolik yuz berdi");
    },
  });
};
