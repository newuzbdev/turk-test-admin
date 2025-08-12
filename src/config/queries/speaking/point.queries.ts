import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResponse,
  SpeakingPoint,
} from "../../../utils/types/types";
import { speakingPointEndpoints, speakingSectionEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";
import toast from "react-hot-toast";

// Create Point
interface CreateSpeakingPointDto {
  speakingSectionId: string;
  order: number;
  type: "ADVANTAGE" | "DISADVANTAGE";
  questions: {
    order: number;
    question: string;
  }[];
  example?: {
    text: string;
    order: number;
  } | {
    text: string;
    order: number;
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
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      toast.success("Speaking point muvaffaqiyatli yaratildi");
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
  example?: {
    text: string;
    order: number;
  } | {
    text: string;
    order: number;
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
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      toast.success("Speaking point muvaffaqiyatli yangilandi");
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
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      toast.success("Speaking point muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Speaking point o'chirishda xatolik yuz berdi");
    },
  });
};
