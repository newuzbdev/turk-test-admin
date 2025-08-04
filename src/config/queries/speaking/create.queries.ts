import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  SpeakingTest,
  OnlySpeakingTest,
} from "../../../utils/types/types";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

// DTO for creating speaking test with full structure
interface CreateSpeakingTestDto {
  title: string;
  ieltsId: string;
  sections: {
    order: number;
    type: string;
    title: string;
    description: string;
    content: string;
    images: string[];
    subParts: {
      label: string;
      description: string;
      images: string[];
      questions: {
        order: number;
        question: string;
      }[];
    }[];
    points?: {
      order: number;
      type: "ADVANTAGE" | "DISADVANTAGE";
      questions: {
        order: number;
        question: string;
      }[];
    }[];
  }[];
}

// DTO for creating only speaking test (without sections)
interface CreateOnlySpeakingTestDto {
  title: string;
  ieltsId: string;
}

export const useCreateSpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingTestDto) => {
      return (
        await axiosPrivate.post<ApiResponse<SpeakingTest>>(
          speakingTestEndpoints.all,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      notification.success({
        message: "Speaking test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useCreateOnlySpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOnlySpeakingTestDto) => {
      return (
        await axiosPrivate.post<ApiResponse<OnlySpeakingTest>>(
          speakingTestEndpoints.only,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.only] });
      notification.success({
        message: "Speaking test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
