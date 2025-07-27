import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  CreateOnlyTest,
  CreateTest,
  OnlyTest,
  Test,
} from "../../../utils/types/types";
import { testEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useCreateTestWithAddition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTest) =>
      (await axiosPrivate.post<ApiResponse<Test>>(testEndpoints.all, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [testEndpoints.all] });
      toast.success("Muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Yaratishda xatolik yuz berdi");
    },
  });
};

export const useCreateOnlyTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOnlyTest) =>
      (await axiosPrivate.post<ApiResponse<OnlyTest>>(testEndpoints.only, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [testEndpoints.only] });
      toast.success("Muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Yaratishda xatolik yuz berdi");
    },
  });
};
