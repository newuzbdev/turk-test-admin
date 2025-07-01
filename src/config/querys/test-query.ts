/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "..";
import { notification } from "antd";
import { testEndpoint } from "../endpoint";

export interface TestAnswerDto {
  variantText: string;
  answer: string;
  correct: boolean;
}

export interface TestQuestionDto {
  number: number;
  type: string;
  text: string;
  answers: TestAnswerDto[];
}

export interface TestSectionDto {
  title: string;
  content: string;
  imageUrl: string;
  questions: TestQuestionDto[];
}

export interface TestPartDto {
  number: number;
  audioUrl: string;
  title: string;
  sections: TestSectionDto[];
}

export interface TestPartDtoAudio {
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
  type?: string // qo‘shimcha
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
