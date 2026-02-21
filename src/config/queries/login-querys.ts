/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/hooks/useAdminAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "..";
import { authEndpoints } from "../endpoint";
import axiosPrivate from "../api";
import { useNavigate } from "react-router-dom";

type LoginInput = {
  name: string;
  password: string;
};

export type UpdateAdminInput = {
  name?: string;
  oldPassword?: string;
  newPassword?: string;
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

type ErrorResponse = {
  success: boolean;
  data: null;
  error: string;
};

export const useAdminLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      try {
        const { data } = await api.post<TokenResponse>(
          authEndpoints.login,
          credentials, // <-- Pass credentials here
        );
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return data;
      } catch (error: any) {
        const errorResponse = error?.response?.data as ErrorResponse;
        throw new Error(errorResponse?.error || "Authentication failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Muvaffaqiyatli tizimga kirildi");
    },
    onError: (error: Error) => {
      toast.error(`Login xatoligi: ${error.message}`);
    },
  });
};

export const useAdminRefresh = () => {
  return useMutation({
    mutationFn: async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("BEARER_TOKEN_NOT_PROVIDED");
        }
        const { data } = await api.post<TokenResponse>(authEndpoints.refresh, {
          refreshToken,
        });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return data;
      } catch (error: any) {
        const errorResponse = error?.response?.data as ErrorResponse;
        throw new Error(errorResponse?.error || "Token refresh failed");
      }
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: UpdateAdminInput & { id: string }) => {
      const { data } = await axiosPrivate.patch(
        authEndpoints.update(id),
        body
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Admin muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      const errorResponse = error?.response?.data as ErrorResponse;
      toast.error(errorResponse?.error || "Admin yangilashda xatolik");
    },
  });
};

export const useAdminLogout = (setAuthenticated?: (auth: boolean) => void) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      try {
        await axiosPrivate.post(authEndpoints.logout);
      } catch (error: any) {
        // Even if logout API fails, we still want to clear local storage
        const errorResponse = error?.response?.data as ErrorResponse;
        throw new Error(errorResponse?.error || "Logout failed");
      }
    },
    onSuccess: () => {
      // Clear tokens and navigate on success
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();

      // Update authentication state
      if (setAuthenticated) {
        setAuthenticated(false);
      }

      toast.success("Tizimdan muvaffaqiyatli chiqildi");

      // Small delay to ensure state updates are processed
      setTimeout(() => {
        navigate("/login");
      }, 100);
    },
    onError: (error: Error) => {
      // Clear tokens and navigate even on error
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();

      // Update authentication state
      if (setAuthenticated) {
        setAuthenticated(false);
      }

      toast.error(`Logout jarayonida xatolik: ${error.message}`);

      // Small delay to ensure state updates are processed
      setTimeout(() => {
        navigate("/login");
      }, 100);
    },
  });
};
