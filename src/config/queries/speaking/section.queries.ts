import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  SpeakingSection,
} from "../../../utils/types/types";
import { speakingSectionEndpoints, speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

// Create Section
interface CreateSpeakingSectionDto {
  speakingTestId: string;
  order: number;
  type: string;
  title: string;
  description: string;
  content: string;
  images: string[];
}

export const useCreateSpeakingSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingSectionDto) => {
      return (
        await axiosPrivate.post<ApiResponse<SpeakingSection>>(
          speakingSectionEndpoints.all,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      notification.success({
        message: "Speaking section muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking section yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

// Get All Sections
export const useGetAllSpeakingSections = () => {
  return useQuery({
    queryKey: [speakingSectionEndpoints.all],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingSection[]>>(
          speakingSectionEndpoints.all
        )
      ).data;
    },
  });
};

// Get One Section
export const useGetOneSpeakingSection = (id: string) => {
  return useQuery({
    queryKey: [speakingSectionEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingSection>>(
          speakingSectionEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};

// Update Section
interface UpdateSpeakingSectionDto {
  id: string;
  order: number;
  type: string;
  title: string;
  description: string;
  content: string;
  images: string[];
}

export const useUpdateSpeakingSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSpeakingSectionDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<SpeakingSection>>(
          speakingSectionEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      notification.success({
        message: "Speaking section muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking section yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

// Delete Section
export const useDeleteSpeakingSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await axiosPrivate.delete(speakingSectionEndpoints.one(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      notification.success({
        message: "Speaking section muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking section o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
