import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { api } from "..";
import { speakingEndpoint } from "../endpoint";

export interface SpeakingSubQuestion {
  order: number;
  question: string;
}

export interface SpeakingSubPart {
  label: string;
  description: string;
  questions: SpeakingSubQuestion[];
}

export interface SpeakingSection {
  order: number;
  type: string;
  title: string;
  description?: string;
  content?: string;
  images: string[];
  advantages: string[];
  disadvantages: string[];
  subParts: SpeakingSubPart[];
  questions: SpeakingSubQuestion[];
}

export interface SpeakingTest {
  id: string;
  title: string;
  ieltsId: string;
  createdAt: string;
  updatedAt: string;
  sections: SpeakingSection[];
}

export type SpeakingTestPayload = Omit<
  SpeakingTest,
  "id" | "createdAt" | "updatedAt"
>;

interface PaginatedSpeakingResponse {
  total: number;
  page: number;
  limit: number;
  data: SpeakingTest[];
}

const queryKey = ["speaking-test"];
const endpoint = speakingEndpoint;

export const useGetSpeakingList = (page: number = 1, limit: number = 10) => {
  return useQuery<PaginatedSpeakingResponse, Error>({
    queryKey: [...queryKey, page, limit],
    queryFn: async () => {
      const { data } = await api.get(`${endpoint}?page=${page}&limit=${limit}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const useCreateSpeakingTest = () => {
  const queryClient = useQueryClient();

  return useMutation<SpeakingTest, Error, SpeakingTestPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(endpoint, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      notification.success({
        message: "Speaking Test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking Test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useUpdateSpeakingTest = () => {
  const queryClient = useQueryClient();

  return useMutation<SpeakingTest, Error, SpeakingTestPayload & { id: string }>(
    {
      mutationFn: async ({ id, ...rest }) => {
        const { data } = await api.patch(`${endpoint}/${id}`, rest);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        notification.success({
          message: "Speaking Test yangilandi",
          placement: "bottomRight",
        });
      },
      onError: () => {
        notification.error({
          message: "Speaking Test yangilashda xatolik yuz berdi",
          placement: "bottomRight",
        });
      },
    }
  );
};

export const useDeleteSpeakingTest = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`${endpoint}/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      notification.success({
        message: "Speaking Test o‘chirildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Speaking Test o‘chirishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useUpdateSpeakingSection = () => {
  return useMutation({
    mutationFn: ({ id, ...rest }: any) =>
      api.patch(`api/speaking-section/${id}`, rest).then((res) => res.data),
  });
};

export const useUpdateSubPart = () => {
  return useMutation({
    mutationFn: ({ id, ...rest }: any) =>
      api.patch(`api/speaking-sub-part/${id}`, rest).then((res) => res.data),
  });
};

export const useUpdateQuestion = () => {
  return useMutation({
    mutationFn: ({ id, ...rest }: any) =>
      api.patch(`api/speaking-question/${id}`, rest).then((res) => res.data),
  });
};
