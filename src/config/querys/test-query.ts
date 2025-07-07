import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "..";
import { notification } from "antd";
import { testEndpoint } from "../endpoint";

export interface TestAnswerDto {
  id?: string;
  questionId?: string;
  variantText: string;
  answer: string;
  correct: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestQuestionDto {
  id?: string;
  sectionId?: string;
  number: number;
  type: string;
  title?: string;
  text: string;
  answers: TestAnswerDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestSectionDto {
  id?: string;
  partId?: string;
  title: string;
  content: string;
  imageUrl: string;
  hasBullets?: boolean;
  questions: TestQuestionDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestPartDto {
  id?: string;
  testId?: string;
  number: number;
  title: string;
  audioUrl: string;
  sections: TestSectionDto[];
  createdAt?: string;
  updatedAt?: string;
}
export interface TestPartDtoAudio {
  id?: string;
  number: number;
  title: string;
  sections: TestSectionDto[];
}

export interface TestItem {
  id: string;
  title: string;
  type: string;
  ieltsId: string;
  createdAt: string;
  updatedAt: string;
  parts: TestPartDto[];
}

export interface TestItemAudio {
  id: string;
  title: string;
  type: string;
  ieltsId: string;
  createdAt: string;
  updatedAt: string;
  parts: TestPartDtoAudio[];
}
export interface CreateTestDto {
  id?: string;
  title: string;
  type: string;
  ieltsId: string;
  parts: TestPartDto[];
}

export interface CreateTestDtoAudio {
  title: string;
  type: string;
  ieltsId: string;
  parts: TestPartDtoAudio[];
}

export interface SubmitAnswerDto {
  questionId: string;
  userAnswer: string;
}

export const useGetTestList = (
  page: number = 1,
  limit: number = 10,
  type?: string
) => {
  return useQuery({
    queryKey: ["test", page, limit, type],
    queryFn: async () => {
      const url = `${testEndpoint}?page=${page}&limit=${limit}${
        type ? `&type=${type}` : ""
      }`;
      const { data } = await api.get(url);
      return data;
    },
  });
};

export const useGetOneTest = (id: string) => {
  return useQuery({
    queryKey: ["test", id],
    queryFn: async () => {
      const { data } = await api.get(`${testEndpoint}/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateTestDto) => {
      const { data } = await api.post(testEndpoint, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      notification.success({
        message: "Test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useUpdateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: CreateTestDto & { id: string }) => {
      const { data } = await api.patch(`${testEndpoint}/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      notification.success({
        message: "Test yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Test yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`${testEndpoint}/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      notification.success({
        message: "Test o'chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Test o'chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useSubmitTestAnswers = () => {
  return useMutation({
    mutationFn: async (answers: SubmitAnswerDto[]) => {
      const { data } = await api.post(`${testEndpoint}/submit-all`, {
        answers,
      });
      return data;
    },
    onSuccess: () => {
      notification.success({
        message: "Javoblar yuborildi",
        placement: "bottomRight",
      });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        notification.error({
          message: "Ruxsat yo'q: admin bo'lishingiz kerak",
          placement: "bottomRight",
        });
      } else {
        notification.error({
          message: "Javoblar yuborishda xatolik",
          placement: "bottomRight",
        });
      }
    },
  });
};

export const useUpdatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<TestPartDto> & { id: string }) => {
      if (!id) throw new Error("Part ID is required for update");
      const { data } = await api.patch(`/api/parts/${id}`, values);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      // Update specific test cache if testId is available
      if (variables.testId) {
        queryClient.invalidateQueries({ queryKey: ["test", variables.testId] });
      }
      notification.success({
        message: "Part muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: (error: any) => {
      console.error("Part update error:", error);
      notification.error({
        message: "Part yangilashda xatolik yuz berdi",
        description: error?.response?.data?.message || "Noma'lum xatolik",
        placement: "bottomRight",
      });
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<TestSectionDto> & { id: string }) => {
      if (!id) throw new Error("Section ID is required for update");
      const { data } = await api.patch(`/api/section/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      notification.success({
        message: "Bo‘lim yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Bo‘lim yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<TestQuestionDto> & { id: string }) => {
      if (!id) throw new Error("Question ID is required for update");
      const { data } = await api.patch(`/api/question/${id}`, values);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      // Update specific test cache if sectionId is available
      if (variables.sectionId) {
        queryClient.invalidateQueries({ queryKey: ["test"] });
      }
      notification.success({
        message: "Savol muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: (error: any) => {
      console.error("Question update error:", error);
      notification.error({
        message: "Savolni yangilashda xatolik yuz berdi",
        description: error?.response?.data?.message || "Noma'lum xatolik",
        placement: "bottomRight",
      });
    },
  });
};

export const useUpdateAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<TestAnswerDto> & { id: string }) => {
      if (!id) throw new Error("Answer ID is required for update");
      const { data } = await api.patch(`/api/answer/${id}`, values);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      // Update specific test cache if questionId is available
      if (variables.questionId) {
        queryClient.invalidateQueries({ queryKey: ["test"] });
      }
      notification.success({
        message: "Javob muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: (error: any) => {
      console.error("Answer update error:", error);
      notification.error({
        message: "Javobni yangilashda xatolik yuz berdi",
        description: error?.response?.data?.message || "Noma'lum xatolik",
        placement: "bottomRight",
      });
    },
  });
};
