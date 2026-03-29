import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  SpeakingTest,
} from "../../../utils/types/types";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

interface UpdateSpeakingTestDto {
  id: string;
  title: string;
  ieltsId: string;
}

export const useUpdateSpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSpeakingTestDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<SpeakingTest>>(
          speakingTestEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.only] });
      toast.success("Speaking test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Speaking test yangilashda xatolik yuz berdi");
    },
  });
};

export const useUpdateSpeakingTestWithAddition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) =>
      (
        await axiosPrivate.patch<ApiResponse<SpeakingTest>>(
          speakingTestEndpoints.full(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.only] });
    },
    onError: (error: any) => {
      console.error("API Error:", error.response?.data);
      toast.error(error.response?.data?.error || "Speaking test yangilashda xatolik yuz berdi");
    },
  });
};
