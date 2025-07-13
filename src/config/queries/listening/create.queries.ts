import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  CreateTest,
  CreateOnlyTest,
  Test,
  OnlyTest,
} from "../../../utils/types/types";
import { listeningEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useCreateListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTest) => {
      const listeningData = { ...data, type: "LISTENING" };
      return (
        await axiosPrivate.post<ApiResponse<Test>>(
          listeningEndpoints.all,
          listeningData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listeningEndpoints.all] });
      notification.success({
        message: "Listening test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Listening test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};

export const useCreateOnlyListeningTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOnlyTest) => {
      const listeningData = { ...data, type: "LISTENING" };
      return (
        await axiosPrivate.post<ApiResponse<OnlyTest>>(
          listeningEndpoints.only,
          listeningData
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listeningEndpoints.only] });
      notification.success({
        message: "Listening test muvaffaqiyatli yaratildi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Listening test yaratishda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
