import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  CreateIELTS,
  IELTS,
} from "../../../utils/types/types";
import axiosPrivate from "../../api";
import { ieltsEndpoints } from "../../endpoint";

export const useCreateIelts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateIELTS) =>
      (await axiosPrivate.post<ApiResponse<IELTS>>(ieltsEndpoints.all, data))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ieltsEndpoints.all] });
      toast.success("Muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Yaratishda xatolik yuz berdi");
    },
  });
};
