import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  SpeakingSubPart,
} from "../../../utils/types/types";
import { speakingSubPartEndpoints, speakingSectionEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

// Create SubPart
interface CreateSpeakingSubPartDto {
  speakingSectionId: string;
  label: string;
  description: string;
}

export const useCreateSpeakingSubPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingSubPartDto) => {
      return (
        await axiosPrivate.post<ApiResponse<SpeakingSubPart>>(
          speakingSubPartEndpoints.all,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      notification.success({
        message: "Speaking sub-part muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking sub-part yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

// Get All SubParts
export const useGetAllSpeakingSubParts = () => {
  return useQuery({
    queryKey: [speakingSubPartEndpoints.all],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingSubPart[]>>(
          speakingSubPartEndpoints.all
        )
      ).data;
    },
  });
};

// Get One SubPart
export const useGetOneSpeakingSubPart = (id: string) => {
  return useQuery({
    queryKey: [speakingSubPartEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingSubPart>>(
          speakingSubPartEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};

// Update SubPart
interface UpdateSpeakingSubPartDto {
  id: string;
  label: string;
  description: string;
}

export const useUpdateSpeakingSubPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSpeakingSubPartDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<SpeakingSubPart>>(
          speakingSubPartEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      notification.success({
        message: "Speaking sub-part muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking sub-part yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

// Delete SubPart
export const useDeleteSpeakingSubPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await axiosPrivate.delete(speakingSubPartEndpoints.one(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      notification.success({
        message: "Speaking sub-part muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking sub-part o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
