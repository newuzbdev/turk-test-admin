import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { learnSkillTagEndpoints } from "@/config/endpoint";
import type {
  LearnSkillTag,
  LearnSkillTagFormValues,
  LearnSkillTagLink,
  LearnSkillTagListResponse,
  LearnSkillTagQuery,
  ReplaceLearnSkillTagLinksPayload,
} from "@/pages/learn/course-types";

const errorMessage = (error: unknown, fallback: string) => {
  const responseError = error as {
    response?: { data?: { message?: string | string[]; error?: string } };
  };
  const message =
    responseError.response?.data?.message ?? responseError.response?.data?.error;
  return Array.isArray(message) ? message.join(", ") : message || fallback;
};

const normalizeSkillTagValues = (values: LearnSkillTagFormValues) => ({
  ...values,
  key: values.key.trim(),
  title: values.title.trim(),
  description: values.description?.trim() || null,
  level: values.level ?? null,
  parentId: values.parentId ?? null,
});

export const useLearnSkillTags = (query: LearnSkillTagQuery = {}) =>
  useQuery({
    queryKey: [learnSkillTagEndpoints.all, query],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnSkillTagListResponse>(
        learnSkillTagEndpoints.all,
        {
          params: {
            page: 1,
            limit: 1000,
            ...query,
          },
        }
      );
      return response.data;
    },
  });

export const useCreateLearnSkillTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: LearnSkillTagFormValues) => {
      const response = await axiosPrivate.post<LearnSkillTag>(
        learnSkillTagEndpoints.all,
        normalizeSkillTagValues(values)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [learnSkillTagEndpoints.all] });
      toast.success("SkillTag oluşturuldu");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "SkillTag oluşturulamadı")),
  });
};

export const useUpdateLearnSkillTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: LearnSkillTagFormValues;
    }) => {
      const response = await axiosPrivate.patch<LearnSkillTag>(
        learnSkillTagEndpoints.one(id),
        normalizeSkillTagValues(values)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [learnSkillTagEndpoints.all] });
      toast.success("SkillTag güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "SkillTag güncellenemedi")),
  });
};

export const useUpdateLearnSkillTagStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const response = await axiosPrivate.patch<LearnSkillTag>(
        learnSkillTagEndpoints.status(id),
        { isActive }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [learnSkillTagEndpoints.all] });
      toast.success("SkillTag durumu güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "SkillTag durumu güncellenemedi")),
  });
};

export const useLearnLessonSkillTags = (lessonId?: string) =>
  useQuery({
    queryKey: [learnSkillTagEndpoints.lessonTags(lessonId ?? "")],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnSkillTagLink[]>(
        learnSkillTagEndpoints.lessonTags(lessonId!)
      );
      return response.data;
    },
    enabled: Boolean(lessonId),
  });

export const useReplaceLearnLessonSkillTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lessonId,
      payload,
    }: {
      lessonId: string;
      payload: ReplaceLearnSkillTagLinksPayload;
    }) => {
      const response = await axiosPrivate.put<LearnSkillTagLink[]>(
        learnSkillTagEndpoints.lessonTags(lessonId),
        payload
      );
      return response.data;
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({
        queryKey: [learnSkillTagEndpoints.lessonTags(lessonId)],
      });
      toast.success("Ders etiketleri kaydedildi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Ders etiketleri kaydedilemedi")),
  });
};

export const useLearnQuestionSkillTags = (questionId?: string) =>
  useQuery({
    queryKey: [learnSkillTagEndpoints.questionTags(questionId ?? "")],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnSkillTagLink[]>(
        learnSkillTagEndpoints.questionTags(questionId!)
      );
      return response.data;
    },
    enabled: Boolean(questionId),
  });

export const useReplaceLearnQuestionSkillTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      payload,
    }: {
      questionId: string;
      payload: ReplaceLearnSkillTagLinksPayload;
    }) => {
      const response = await axiosPrivate.put<LearnSkillTagLink[]>(
        learnSkillTagEndpoints.questionTags(questionId),
        payload
      );
      return response.data;
    },
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({
        queryKey: [learnSkillTagEndpoints.questionTags(questionId)],
      });
      toast.success("Soru etiketleri kaydedildi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Soru etiketleri kaydedilemedi")),
  });
};
