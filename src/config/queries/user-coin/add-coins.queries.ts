import { useMutation } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { userCoinEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { AddCoinsPayload } from "@/utils/types/types";
import { isAxiosError } from "axios";

export const useAddCoinsToUser = () => {
  return useMutation({
    mutationFn: async (payload: AddCoinsPayload) => {
      const response = await axiosPrivate.post(userCoinEndpoints.addCoins, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Coin başarıyla eklendi");
    },
    onError: (error: unknown) => {
      const message =
        (isAxiosError(error) &&
          (error.response?.data?.message || error.response?.data?.error)) ||
        "Coin eklenemedi";

      toast.error(message);
    },
  });
};
