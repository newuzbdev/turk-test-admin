import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  SpeakingQuestion,
} from "../../../utils/types/types";
import { speakingQuestionEndpoints, speakingSectionEndpoints, speakingSubPartEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

// Create Section Question
interface CreateSpeakingQuestionDto {
  speakingSectionId: string;
  order: number;
  questionText: string;
}

export const useCreateSpeakingQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSpeakingQuestionDto) => {
      return (
        await axiosPrivate.post<ApiResponse<SpeakingQuestion>>(
          speakingQuestionEndpoints.all,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      toast.success("Speaking question muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Speaking question yaratishda xatolik yuz berdi");
    },
  });
};

// Create SubPart Question
interface CreateSubPartQuestionDto {
  speakingSubPartId: string;
  order: number;
  questionText: string;
}

export const useCreateSubPartQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSubPartQuestionDto) => {
      return (
        await axiosPrivate.post<ApiResponse<SpeakingQuestion>>(
          speakingQuestionEndpoints.subpartQuestions,
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSubPartEndpoints.all] });
      toast.success("Sub-part question muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Sub-part question yaratishda xatolik yuz berdi");
    },
  });
};

// Get All Questions
export const useGetAllSpeakingQuestions = () => {
  return useQuery({
    queryKey: [speakingQuestionEndpoints.all],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingQuestion[]>>(
          speakingQuestionEndpoints.all
        )
      ).data;
    },
  });
};

// Get One Question
export const useGetOneSpeakingQuestion = (id: string) => {
  return useQuery({
    queryKey: [speakingQuestionEndpoints.one(id)],
    queryFn: async () => {
      return (
        await axiosPrivate.get<ApiResponse<SpeakingQuestion>>(
          speakingQuestionEndpoints.one(id)
        )
      ).data;
    },
    enabled: !!id,
  });
};

// Update Question
interface UpdateSpeakingQuestionDto {
  id: string;
  order: number;
  questionText: string;
}

export const useUpdateSpeakingQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSpeakingQuestionDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<SpeakingQuestion>>(
          speakingQuestionEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSubPartEndpoints.all] });
      toast.success("Speaking question muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Speaking question yangilashda xatolik yuz berdi");
    },
  });
};

// Delete Question
export const useDeleteSpeakingQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await axiosPrivate.delete(speakingQuestionEndpoints.one(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingQuestionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingSubPartEndpoints.all] });
      toast.success("Speaking question muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Speaking question o'chirishda xatolik yuz berdi");
    },
  });
};
