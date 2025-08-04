import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
import { notification } from "antd";
import type { ApiResponse, SpeakingPoint } from "../../../utils/types/types";
import {
  speakingPointEndpoints,
  speakingSectionEndpoints,
} from "../../endpoint";
=======
import toast from "react-hot-toast";
import type {
  ApiResponse,
  SpeakingPoint,
} from "../../../utils/types/types";
import { speakingPointEndpoints, speakingSectionEndpoints } from "../../endpoint";
>>>>>>> 7e0758a70e6f09c9d4c277c95df1b76ab4c626f0
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
<<<<<<< HEAD
      queryClient.invalidateQueries({
        queryKey: [speakingSectionEndpoints.all],
      });
      notification.success({
        message: "Speaking point muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
=======
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      toast.success("Speaking point muvaffaqiyatli yaratildi");
>>>>>>> 7e0758a70e6f09c9d4c277c95df1b76ab4c626f0
    },
    onError: () => {
      toast.error("Speaking point yaratishda xatolik yuz berdi");
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
<<<<<<< HEAD
      queryClient.invalidateQueries({
        queryKey: [speakingSectionEndpoints.all],
      });
      notification.success({
        message: "Speaking point muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
=======
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      toast.success("Speaking point muvaffaqiyatli yangilandi");
>>>>>>> 7e0758a70e6f09c9d4c277c95df1b76ab4c626f0
    },
    onError: () => {
      toast.error("Speaking point yangilashda xatolik yuz berdi");
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
<<<<<<< HEAD
      queryClient.invalidateQueries({
        queryKey: [speakingSectionEndpoints.all],
      });
      notification.success({
        message: "Speaking point muvaffaqiyatli o'chirildi",
        placement: "bottomRight",
      });
=======
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      toast.success("Speaking point muvaffaqiyatli o'chirildi");
>>>>>>> 7e0758a70e6f09c9d4c277c95df1b76ab4c626f0
    },
    onError: () => {
      toast.error("Speaking point o'chirishda xatolik yuz berdi");
    },
  });
};
