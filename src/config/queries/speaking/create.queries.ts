import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
      examples?: {
        text: string;
        order: number;
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
      toast.success("Speaking test muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Speaking test yaratishda xatolik yuz berdi");
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
      toast.success("Speaking test muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Speaking test yaratishda xatolik yuz berdi");
    },
  });
};
