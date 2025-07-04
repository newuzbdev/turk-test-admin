import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { api } from "..";
import { writingEndpoints } from "../endpoint";
import type { ApiResponse, PaginatedResponse } from "../../utils/types/types";

export interface WritingTest {
    id: string;
    title: string;
    task1Title: string;
    task2Title: string;
    task1: string;
    task2: string;
    instruction: string;
    ieltsId: string;
    createdAt: string;
    updatedAt: string;
}

export type WritingTestPayload = Omit<WritingTest, "id" | "createdAt" | "updatedAt">;

export const useGetWritingTests = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: [writingEndpoints.all, page],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<WritingTest>>(
                `${writingEndpoints.all}?page=${page}&limit=${limit}`
            );
            return data;
        },
    });
};

export const useGetWritingTestById = (id?: string) => {
    return useQuery({
        queryKey: [writingEndpoints.one(id || "")],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<WritingTest>>(writingEndpoints.one(id!));
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateWritingTest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: WritingTestPayload) =>
            (await api.post<ApiResponse<WritingTest>>(writingEndpoints.all, payload)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [writingEndpoints.all] });
            notification.success({
                message: "Writing Test muvaffaqiyatli yaratildi",
                placement: "bottomRight",
            });
        },
        onError: () => {
            notification.error({
                message: "Writing Test yaratishda xatolik yuz berdi",
                placement: "bottomRight",
            });
        },
    });
};

export const useUpdateWritingTest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: Partial<WritingTestPayload> & { id: string }) =>
            (await api.patch<ApiResponse<WritingTest>>(writingEndpoints.one(id), payload)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [writingEndpoints.all] });
            notification.success({
                message: "Writing Test muvaffaqiyatli yangilandi",
                placement: "bottomRight",
            });
        },
        onError: () => {
            notification.error({
                message: "Writing Test yangilashda xatolik yuz berdi",
                placement: "bottomRight",
            });
        },
    });
};

export const useDeleteWritingTest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) =>
            (await api.delete<ApiResponse<null>>(writingEndpoints.one(id))).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [writingEndpoints.all] });
            notification.success({
                message: "Writing Test muvaffaqiyatli o'chirildi",
                placement: "bottomRight",
            });
        },
        onError: () => {
            notification.error({
                message: "Writing Test o'chirishda xatolik yuz berdi",
                placement: "bottomRight",
            });
        },
    });
};
