import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateTest,
  CreateOnlyTest,
  Test,
  OnlyTest,
} from "../../../utils/types/types";
import { listeningEndpoints } from "../../endpoint";
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
        answers: {
          variantText: string;
          answer: string;
          correct: boolean;
        }[];
      }[];
    }[];
  }[];
}

export const useCreateListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTest) => {
      const listeningData = { ...data, type: "LISTENING" };
      return (
        await axiosPrivate.post<ApiResponse<Test>>(
          listeningEndpoints.all,
          listeningData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listeningEndpoints.all] });
      notification.success({
        message: "Listening test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Listening test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useCreateListeningTestWithAddition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTestWithAdditionDto) => {
      return (
        await axiosPrivate.post<ApiResponse<Test>>(listeningEndpoints.all, data)
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listeningEndpoints.all] });
      notification.success({
        message: "Listening test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: (error: any) => {
      console.error("API Error:", error.response?.data);
      notification.error({
        message: "Listening test yaratishda xatolik yuz berdi",
        description: error.response?.data?.error || "Unknown error",
        placement: "bottomRight",
      });
    },
  });
};

export const useCreateOnlyListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOnlyTest) => {
      const listeningData = { ...data, type: "LISTENING" };
      return (
        await axiosPrivate.post<ApiResponse<OnlyTest>>(
          listeningEndpoints.only,
          listeningData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listeningEndpoints.only] });
      notification.success({
        message: "Listening test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Listening test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
