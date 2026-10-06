import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosPrivate from "@/config/api";
import { learnStructureEndpoints } from "@/config/endpoint";
import type {
  LearnExercise,
  LearnExerciseFormValues,
  LearnExerciseQuestion,
  LearnPublishStatus,
  LearnQuestionPayload,
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

const useInvalidateExerciseData = () => {
  const queryClient = useQueryClient();
  return {
    exercises: (lessonId: string, courseId: string) => {
      queryClient.invalidateQueries({
        queryKey: [learnStructureEndpoints.exercises(lessonId)],
      });
      queryClient.invalidateQueries({
        queryKey: [learnStructureEndpoints.course(courseId)],
      });
    },
    questions: (exerciseId: string) =>
      queryClient.invalidateQueries({
        queryKey: [learnStructureEndpoints.questions(exerciseId)],
      }),
  };
};

export const useLearnLessonExercises = (lessonId?: string) =>
  useQuery({
    queryKey: [learnStructureEndpoints.exercises(lessonId ?? "")],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnExercise[]>(
        learnStructureEndpoints.exercises(lessonId!)
      );
      return response.data;
    },
    enabled: Boolean(lessonId),
  });

export const useLearnExerciseQuestions = (exerciseId?: string) =>
  useQuery({
    queryKey: [learnStructureEndpoints.questions(exerciseId ?? "")],
    queryFn: async () => {
      const response = await axiosPrivate.get<LearnExerciseQuestion[]>(
        learnStructureEndpoints.questions(exerciseId!)
      );
      return response.data;
    },
    enabled: Boolean(exerciseId),
  });

export const useCreateLearnExercise = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: {
      lessonId: string;
      courseId: string;
      values: LearnExerciseFormValues;
    }) => {
      const response = await axiosPrivate.post<LearnExercise>(
        learnStructureEndpoints.exercises(variables.lessonId),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) => {
      invalidate.exercises(lessonId, courseId);
      toast.success("Alıştırma oluşturuldu");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Alıştırma oluşturulamadı")),
  });
};

export const useUpdateLearnExercise = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: {
      id: string;
      lessonId: string;
      courseId: string;
      values: LearnExerciseFormValues;
    }) => {
      const response = await axiosPrivate.patch<LearnExercise>(
        learnStructureEndpoints.exercise(variables.id),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) => {
      invalidate.exercises(lessonId, courseId);
      toast.success("Alıştırma güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Alıştırma güncellenemedi")),
  });
};

export const useUpdateLearnExerciseStatus = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: {
      id: string;
      lessonId: string;
      courseId: string;
      status: LearnPublishStatus;
    }) => {
      const response = await axiosPrivate.patch<LearnExercise>(
        learnStructureEndpoints.exerciseStatus(variables.id),
        { status: variables.status }
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) =>
      invalidate.exercises(lessonId, courseId),
    onError: (error) =>
      toast.error(errorMessage(error, "Alıştırma durumu güncellenemedi")),
  });
};

export const useReorderLearnExercises = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: {
      lessonId: string;
      courseId: string;
      items: ReorderLearnStructureItem[];
    }) => {
      const response = await axiosPrivate.post<LearnExercise[]>(
        learnStructureEndpoints.reorderExercises(variables.lessonId),
        { items: variables.items }
      );
      return response.data;
    },
    onSuccess: (_, { lessonId, courseId }) =>
      invalidate.exercises(lessonId, courseId),
    onError: (error) =>
      toast.error(errorMessage(error, "Alıştırma sırası güncellenemedi")),
  });
};

export const useCreateLearnQuestion = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: {
      exerciseId: string;
      values: LearnQuestionPayload;
    }) => {
      const response = await axiosPrivate.post<LearnExerciseQuestion>(
        learnStructureEndpoints.questions(variables.exerciseId),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { exerciseId }) => {
      invalidate.questions(exerciseId);
      toast.success("Soru oluşturuldu");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Soru oluşturulamadı")),
  });
};

export const useUpdateLearnQuestion = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: {
      id: string;
      exerciseId: string;
      values: LearnQuestionPayload;
    }) => {
      const response = await axiosPrivate.patch<LearnExerciseQuestion>(
        learnStructureEndpoints.question(variables.id),
        variables.values
      );
      return response.data;
    },
    onSuccess: (_, { exerciseId }) => {
      invalidate.questions(exerciseId);
      toast.success("Soru güncellendi");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Soru güncellenemedi")),
  });
};

export const useDeleteLearnQuestion = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: { id: string; exerciseId: string }) => {
      const response = await axiosPrivate.delete<LearnExerciseQuestion>(
        learnStructureEndpoints.question(variables.id)
      );
      return response.data;
    },
    onSuccess: (_, { exerciseId }) => {
      invalidate.questions(exerciseId);
      toast.success("Soru silindi");
    },
    onError: (error) => toast.error(errorMessage(error, "Soru silinemedi")),
  });
};

export const useReorderLearnQuestions = () => {
  const invalidate = useInvalidateExerciseData();
  return useMutation({
    mutationFn: async (variables: {
      exerciseId: string;
      items: ReorderLearnStructureItem[];
    }) => {
      const response = await axiosPrivate.post<LearnExerciseQuestion[]>(
        learnStructureEndpoints.reorderQuestions(variables.exerciseId),
        { items: variables.items }
      );
      return response.data;
    },
    onSuccess: (_, { exerciseId }) => invalidate.questions(exerciseId),
    onError: (error) =>
      toast.error(errorMessage(error, "Soru sırası güncellenemedi")),
  });
};
