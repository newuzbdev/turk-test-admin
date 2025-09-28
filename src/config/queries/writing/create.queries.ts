import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  CreateWritingTest,
  WritingTest,
} from "../../../utils/types/types";
import { writingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

// DTO for creating test with full structure (matching API requirements)
interface CreateWritingTestWithAdditionDto {
  title: string;
  instruction: string;
  ieltsId: string;
  sections: {
    order: number;
    title: string;
    description: string;
    subParts: {
      order: number;
      label: string;
      description: string;
      questions: {
        text: string;
        order: number;
      }[];
    }[];
    questions?: {
      text: string;
      order: number;
    }[];
  }[];
}

export const useCreateWritingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWritingTest) => {
      return (
        await axiosPrivate.post<ApiResponse<WritingTest>>(
          writingTestEndpoints.all,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing test muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Writing test yaratishda xatolik yuz berdi");
    },
  });
};

export const useCreateWritingTestWithAddition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWritingTestWithAdditionDto) => {
      return (
        await axiosPrivate.post<ApiResponse<WritingTest>>(
          writingTestEndpoints.all,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing test muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      console.error("API Error:", error.response?.data);
      toast.error(error.response?.data?.error || "Writing test yaratishda xatolik yuz berdi");
    },
  });
};
