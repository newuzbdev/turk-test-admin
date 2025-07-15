/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/hooks/useAdminAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { api } from "..";
import { authEndpoints } from "../endpoint";
import axiosPrivate from "../api";

type LoginInput = {
  name: string;
  password: string;
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
          credentials
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
      notification.success({
        message: "Muvaffaqiyatli tizimga kirildi",
        placement: "bottomRight",
      });
    },
    onError: (error: Error) => {
      notification.error({
        message: `Login xatoligi: ${error.message}`,
        placement: "bottomRight",
      });
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

export const useAdminLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await axiosPrivate.post(authEndpoints.logout);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      } catch (error: any) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";

        const errorResponse = error?.response?.data as ErrorResponse;
        throw new Error(errorResponse?.error || "Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.clear();
      notification.success({
        message: "Tizimdan muvaffaqiyatli chiqildi",
        placement: "bottomRight",
      });
    },
    onError: (error: Error) => {
      queryClient.clear();
      notification.error({
        message: `Logout jarayonida xatolik: ${error.message}`,
        placement: "bottomRight",
      });
    },
  });
};
