import { useMutation } from "@tanstack/react-query";
import axiosPrivate from "@/config/api";
import { userCoinEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { SearchUserResponse } from "@/utils/types/types";

export const useSearchUser = () => {
  return useMutation({
    mutationFn: async (identifier: string) => {
      try {
        const response = await axiosPrivate.get<SearchUserResponse>(userCoinEndpoints.search, {
          params: { identifier },
        });

        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        const backendError = error?.response?.data?.error;

        const shouldFallbackToPost =
          status === 404 ||
          status === 405 ||
          (typeof backendError === "string" && backendError.includes("Cannot GET"));

        if (!shouldFallbackToPost) {
          throw error;
        }

        const postResponse = await axiosPrivate.post<SearchUserResponse>(userCoinEndpoints.search, {
          identifier,
        });

        return postResponse.data;
      }
    },
    onError: (error: any) => {
      const backendError = error?.response?.data?.error;
      const message =
        error?.response?.data?.message ||
        (typeof backendError === "string" && backendError.includes("Cannot")
          ? "User search endpoint backendda mavjud emas yoki method mos emas"
          : backendError) ||
        "User qidirishda xatolik yuz berdi";

      toast.error(message);
    },
  });
};
