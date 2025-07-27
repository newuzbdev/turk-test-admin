import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  WritingTest,
} from "../../../utils/types/types";
import { writingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

interface UpdateWritingTestData {
  id: string;
  title: string;
  ieltsId: string;
}

export const useUpdateWritingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateWritingTestData) => {
      return (
        await axiosPrivate.patch<ApiResponse<WritingTest>>(
          writingTestEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing test muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing test yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing test title
interface UpdateWritingTestTitleDto {
  id: string;
  title: string;
}

export const useUpdateWritingTestTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: UpdateWritingTestTitleDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<WritingTest>>(
          writingTestEndpoints.updateTitle(id),
          { title }
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing test title muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing test title yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing test instruction
interface UpdateWritingTestInstructionDto {
  id: string;
  instruction: string;
}

export const useUpdateWritingTestInstruction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, instruction }: UpdateWritingTestInstructionDto) => {
      return (
        await axiosPrivate.patch<ApiResponse<WritingTest>>(
          writingTestEndpoints.updateInstruction(id),
          { instruction }
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing test instruction muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing test instruction yangilashda xatolik yuz berdi");
    },
  });
};
