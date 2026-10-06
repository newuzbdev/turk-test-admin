import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { learnStructureEndpoints } from "@/config/endpoint";
import type {
  LearnCourseModule,
  LearnCourseStructure,
  LearnLesson,
  LearnLessonFormValues,
  LearnModuleFormValues,
  LearnPublishStatus,
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

const useInvalidateStructure = () => {
  const queryClient = useQueryClient();
  return (courseId: string) =>
    queryClient.invalidateQueries({
      queryKey: [learnStructureEndpoints.course(courseId)],
    });
};

export const useLearnCourseStructure = (courseId?: string) =>
  useQuery({
    queryKey: [learnStructureEndpoints.course(courseId ?? "")],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnCourseStructure>(
        learnStructureEndpoints.course(courseId!)
      );
      return response.data;
    },
    enabled: Boolean(courseId),
  });

export const useCreateLearnModule = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async ({
      courseId,
      values,
    }: {
      courseId: string;
      values: LearnModuleFormValues;
    }) => {
      const response = await axiosPrivate.post<LearnCourseModule>(
        learnStructureEndpoints.createModule(courseId),
        values
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      invalidate(courseId);
      toast.success("Modül oluşturuldu");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Modül oluşturulamadı")),
  });
};

export const useUpdateLearnModule = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      courseId: string;
      values: LearnModuleFormValues;
    }) => {
      const response = await axiosPrivate.patch<LearnCourseModule>(
        learnStructureEndpoints.module(variables.id),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      invalidate(courseId);
      toast.success("Modül güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Modül güncellenemedi")),
  });
};

export const useUpdateLearnModuleStatus = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      courseId: string;
      status: LearnPublishStatus;
    }) => {
      const response = await axiosPrivate.patch<LearnCourseModule>(
        learnStructureEndpoints.moduleStatus(variables.id),
        { status: variables.status }
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      invalidate(courseId);
      toast.success("Modül durumu güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Modül durumu güncellenemedi")),
  });
};

export const useReorderLearnModules = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async (variables: {
      courseId: string;
      items: ReorderLearnStructureItem[];
    }) => {
      const response = await axiosPrivate.post<LearnCourseModule[]>(
        learnStructureEndpoints.reorderModules(variables.courseId),
        { items: variables.items }
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => invalidate(courseId),
    onError: (error) =>
      toast.error(errorMessage(error, "Modül sırası güncellenemedi")),
  });
};

export const useCreateLearnLesson = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async (variables: {
      moduleId: string;
      courseId: string;
      values: LearnLessonFormValues;
    }) => {
      const response = await axiosPrivate.post<LearnLesson>(
        learnStructureEndpoints.createLesson(variables.moduleId),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      invalidate(courseId);
      toast.success("Ders oluşturuldu");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Ders oluşturulamadı")),
  });
};

export const useUpdateLearnLesson = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      courseId: string;
      values: LearnLessonFormValues;
    }) => {
      const response = await axiosPrivate.patch<LearnLesson>(
        learnStructureEndpoints.lesson(variables.id),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      invalidate(courseId);
      toast.success("Ders güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Ders güncellenemedi")),
  });
};

export const useUpdateLearnLessonStatus = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      courseId: string;
      status: LearnPublishStatus;
    }) => {
      const response = await axiosPrivate.patch<LearnLesson>(
        learnStructureEndpoints.lessonStatus(variables.id),
        { status: variables.status }
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      invalidate(courseId);
      toast.success("Ders durumu güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Ders durumu güncellenemedi")),
  });
};

export const useReorderLearnLessons = () => {
  const invalidate = useInvalidateStructure();

  return useMutation({
    mutationFn: async (variables: {
      moduleId: string;
      courseId: string;
      items: ReorderLearnStructureItem[];
    }) => {
      const response = await axiosPrivate.post<LearnLesson[]>(
        learnStructureEndpoints.reorderLessons(variables.moduleId),
        { items: variables.items }
      );
      return response.data;
    },
    onSuccess: (_, { courseId }) => invalidate(courseId),
    onError: (error) =>
      toast.error(errorMessage(error, "Ders sırası güncellenemedi")),
  });
};
