import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { testCoinPriceEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { UpdateTestCoinPrice } from "@/utils/types/types";
import { isAxiosError } from "axios";

export const useUpdateTestCoinPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateTestCoinPrice) => {
      const { id, ...updateData } = data;
      const response = await axiosPrivate.patch(testCoinPriceEndpoints.one(id), updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [testCoinPriceEndpoints.all] });
      toast.success("Coin ücreti güncellendi");
    },
    onError: (error: unknown) => {
      const msg =
        (isAxiosError(error) && error.response?.data?.error) ||
        "Coin ücreti güncellenemedi";
      toast.error(msg);
    },
  });
};


