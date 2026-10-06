import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { learnStructureEndpoints } from "@/config/endpoint";
import type {
  LearnContentBlock,
  LearnContentBlockPayload,
  ReorderLearnStructureItem,
} from "@/pages/learn/course-types";

const errorMessage = (error: unknown, fallback: string) => {
  const responseError = error as {
    response?: { data?: { message?: string | string[]; error?: string } };
  };
  const message =
    responseError.response?.data?.message ?? responseError.response?.data?.error;

  return Array.isArray(message) ? message.join(", ") : message || fallback;
};

const useInvalidateBlocks = () => {
  const queryClient = useQueryClient();
  return (lessonId: string, courseId: string) => {
    queryClient.invalidateQueries({
      queryKey: [learnStructureEndpoints.blocks(lessonId)],
    });
    queryClient.invalidateQueries({
      queryKey: [learnStructureEndpoints.course(courseId)],
    });
  };
};

export const useLearnLessonBlocks = (lessonId?: string) =>
  useQuery({
    queryKey: [learnStructureEndpoints.blocks(lessonId ?? "")],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnContentBlock[]>(
        learnStructureEndpoints.blocks(lessonId!)
      );
      return response.data;
    },
    enabled: Boolean(lessonId),
  });

export const useCreateLearnBlock = () => {
  const invalidate = useInvalidateBlocks();

  return useMutation({
    mutationFn: async (variables: {
      lessonId: string;
      courseId: string;
      values: LearnContentBlockPayload;
    }) => {
      const response = await axiosPrivate.post<LearnContentBlock>(
        learnStructureEndpoints.blocks(variables.lessonId),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) => {
      invalidate(lessonId, courseId);
      toast.success("İçerik bloğu oluşturuldu");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "İçerik bloğu oluşturulamadı")),
  });
};

export const useUpdateLearnBlock = () => {
  const invalidate = useInvalidateBlocks();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      lessonId: string;
      courseId: string;
      values: LearnContentBlockPayload;
    }) => {
      const response = await axiosPrivate.patch<LearnContentBlock>(
        learnStructureEndpoints.block(variables.id),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) => {
      invalidate(lessonId, courseId);
      toast.success("İçerik bloğu güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "İçerik bloğu güncellenemedi")),
  });
};

export const useDeleteLearnBlock = () => {
  const invalidate = useInvalidateBlocks();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      lessonId: string;
      courseId: string;
    }) => {
      const response = await axiosPrivate.delete<LearnContentBlock>(
        learnStructureEndpoints.block(variables.id)
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) => {
      invalidate(lessonId, courseId);
      toast.success("İçerik bloğu silindi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "İçerik bloğu silinemedi")),
  });
};

export const useReorderLearnBlocks = () => {
  const invalidate = useInvalidateBlocks();

  return useMutation({
    mutationFn: async (variables: {
      lessonId: string;
      courseId: string;
      items: ReorderLearnStructureItem[];
    }) => {
      const response = await axiosPrivate.post<LearnContentBlock[]>(
        learnStructureEndpoints.reorderBlocks(variables.lessonId),
        { items: variables.items }
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) =>
      invalidate(lessonId, courseId),
    onError: (error) =>
      toast.error(errorMessage(error, "Blok sırası güncellenemedi")),
  });
};
