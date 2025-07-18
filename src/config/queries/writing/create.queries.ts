import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
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
      question: string;
      questions?: {
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
      notification.success({
        message: "Writing test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Writing test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
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
      notification.success({
        message: "Writing test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: (error: any) => {
      console.error("API Error:", error.response?.data);
      notification.error({
        message: "Writing test yaratishda xatolik yuz berdi",
        description: error.response?.data?.error || "Unknown error",
        placement: "bottomRight",
      });
    },
  });
};
