import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { learnCourseEndpoints } from "@/config/endpoint";
import type {
  LearnCourse,
  LearnCourseFormValues,
  LearnCourseListResponse,
  LearnCourseQuery,
  LearnPublishStatus,
  ReorderLearnCourseItem,
} from "@/pages/learn/course-types";

const errorMessage = (error: unknown, fallback: string) => {
  const responseError = error as {
    response?: { data?: { message?: string | string[]; error?: string } };
  };
  const message =
    responseError.response?.data?.message ?? responseError.response?.data?.error;

  return Array.isArray(message) ? message.join(", ") : message || fallback;
};

export const useLearnCourses = (query: LearnCourseQuery = {}) =>
  useQuery({
    queryKey: [learnCourseEndpoints.all, query],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnCourseListResponse>(
        learnCourseEndpoints.all,
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

export const useLearnCourse = (id?: string) =>
  useQuery({
    queryKey: [learnCourseEndpoints.all, id],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnCourse>(
        learnCourseEndpoints.one(id!)
      );
      return response.data;
    },
    enabled: Boolean(id),
  });

export const useCreateLearnCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: LearnCourseFormValues) => {
      const response = await axiosPrivate.post<LearnCourse>(
        learnCourseEndpoints.all,
        values
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [learnCourseEndpoints.all] });
      toast.success("Kurs oluşturuldu");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Kurs oluşturulamadı")),
  });
};

export const useUpdateLearnCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: LearnCourseFormValues;
    }) => {
      const response = await axiosPrivate.patch<LearnCourse>(
        learnCourseEndpoints.one(id),
        values
      );
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [learnCourseEndpoints.all] });
      queryClient.invalidateQueries({
        queryKey: [learnCourseEndpoints.all, id],
      });
      toast.success("Kurs güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Kurs güncellenemedi")),
  });
};

export const useUpdateLearnCourseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: LearnPublishStatus;
    }) => {
      const response = await axiosPrivate.patch<LearnCourse>(
        learnCourseEndpoints.status(id),
        { status }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [learnCourseEndpoints.all] });
      toast.success("Kurs durumu güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Kurs durumu güncellenemedi")),
  });
};

export const useReorderLearnCourses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: ReorderLearnCourseItem[]) => {
      const response = await axiosPrivate.post<LearnCourse[]>(
        learnCourseEndpoints.reorder,
        { items }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [learnCourseEndpoints.all] });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Kurs sırası güncellenemedi")),
  });
};
