import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type { ApiResponse, SpeakingPoint } from "../../../utils/types/types";
import {
  speakingPointEndpoints,
  speakingSectionEndpoints,
} from "../../endpoint";
import axiosPrivate from "../../api";

// Create Point
interface CreateSpeakingPointDto {
  speakingSectionId: string;
  order: number;
  type: "ADVANTAGE" | "DISADVANTAGE";
  questions: {
    order: number;
    question: string;
  }[];
}

export const useCreateSpeakingPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingPointDto) => {
      return (
        await axiosPrivate.post<ApiResponse<SpeakingPoint>>(
          speakingPointEndpoints.all,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingPointEndpoints.all] });
      queryClient.invalidateQueries({
        queryKey: [speakingSectionEndpoints.all],
      });
      notification.success({
        message: "Speaking point muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking point yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

// Get All Points
export const useGetAllSpeakingPoints = () => {
  return useQuery({
    queryKey: [speakingPointEndpoints.all],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingPoint[]>>(
          speakingPointEndpoints.all
        )
      ).data;
    },
  });
};

// Get One Point
export const useGetOneSpeakingPoint = (id: string) => {
  return useQuery({
    queryKey: [speakingPointEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingPoint>>(
          speakingPointEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};

// Update Point
interface UpdateSpeakingPointDto {
  id: string;
  order: number;
  type: "ADVANTAGE" | "DISADVANTAGE";
  questions: {
    order: number;
    question: string;
  }[];
}

export const useUpdateSpeakingPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSpeakingPointDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<SpeakingPoint>>(
          speakingPointEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingPointEndpoints.all] });
      queryClient.invalidateQueries({
        queryKey: [speakingSectionEndpoints.all],
      });
      notification.success({
        message: "Speaking point muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking point yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

// Delete Point
export const useDeleteSpeakingPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await axiosPrivate.delete(speakingPointEndpoints.one(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingPointEndpoints.all] });
      queryClient.invalidateQueries({
        queryKey: [speakingSectionEndpoints.all],
      });
      notification.success({
        message: "Speaking point muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking point o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
