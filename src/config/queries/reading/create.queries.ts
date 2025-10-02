import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  CreateTest,
  CreateOnlyTest,
  Test,
  OnlyTest,
} from "../../../utils/types/types";
import { readingEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

// DTO for creating test with full structure (matching API requirements)
interface CreateTestWithAdditionDto {
  title: string;
  description: string;
  type: string;
  ieltsId: string;
  parts: {
    number: number;
    title: string;
    audioUrl: string;
    sections: {
      title: string;
      content: string;
      imageUrl: string;
      questions: {
        number: number;
        type: string;
        text: string;
        content?: string;
        imageUrl?: string;
        answers: {
          variantText: string;
          answer: string;
          correct: boolean;
        }[];
      }[];
    }[];
  }[];
}

export const useCreateReadingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTest) => {
      const readingData = { ...data, type: "READING" };
      return (
        await axiosPrivate.post<ApiResponse<Test>>(
          readingEndpoints.all,
          readingData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [readingEndpoints.all] });
      toast.success("Reading test muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Reading test yaratishda xatolik yuz berdi");
    },
  });
};

export const useCreateReadingTestWithAddition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTestWithAdditionDto) => {
      return (
        await axiosPrivate.post<ApiResponse<Test>>(readingEndpoints.all, data)
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [readingEndpoints.all] });
      toast.success("Reading test muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      console.error("API Error:", error.response?.data);
      toast.error(error.response?.data?.error || "Reading test yaratishda xatolik yuz berdi");
    },
  });
};

export const useCreateOnlyReadingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOnlyTest) => {
      const readingData = { ...data, type: "READING" };
      return (
        await axiosPrivate.post<ApiResponse<OnlyTest>>(
          readingEndpoints.only,
          readingData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [readingEndpoints.only] });
      toast.success("Reading test muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Reading test yaratishda xatolik yuz berdi");
    },
  });
};
