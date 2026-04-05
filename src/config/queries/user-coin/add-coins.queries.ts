import { useMutation } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { userCoinEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { AddCoinsPayload } from "@/utils/types/types";

export const useAddCoinsToUser = () => {
  return useMutation({
    mutationFn: async (payload: AddCoinsPayload) => {
      const response = await axiosPrivate.post(userCoinEndpoints.addCoins, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Coin muvaffaqiyatli qo'shildi");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Coin qo'shishda xatolik yuz berdi";

      toast.error(message);
    },
  });
};
