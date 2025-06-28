// src/api/hooks/useAdminAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { api } from "..";
import { authEndpoints } from "../endpoint";

type LoginInput = {
    name: string;
    password: string;
};

type TokenResponse = {
    accessToken: string;
    refreshToken: string;
};

export const useAdminLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (credentials: LoginInput) => {
            const { data } = await api.post<TokenResponse>(authEndpoints.login, credentials);
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(); // kerakli auth-related querylarni yangilash
            notification.success({
                message: "Muvaffaqiyatli tizimga kirildi",
                placement: "bottomRight",
            });
        },
        onError: () => {
            notification.error({
                message: "Login xatoligi: foydalanuvchi nomi yoki parol noto‘g‘ri",
                placement: "bottomRight",
            });
        },
    });
};

export const useAdminRefresh = () => {
    return useMutation({
        mutationFn: async () => {
            const refreshToken = localStorage.getItem("refreshToken");
            const { data } = await api.post<TokenResponse>(authEndpoints.refresh, { refreshToken });
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            return data;
        },
    });
};

export const useAdminLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await api.post(authEndpoints.logout);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        },
        onSuccess: () => {
            queryClient.clear();
            notification.success({
                message: "Tizimdan muvaffaqiyatli chiqildi",
                placement: "bottomRight",
            });
        },
        onError: () => {
            notification.error({
                message: "Logout jarayonida xatolik yuz berdi",
                placement: "bottomRight",
            });
        },
    });
};
