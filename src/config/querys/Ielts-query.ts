import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '..';
import { notification } from 'antd';
import { ieltsEndpoint } from '../endpoint';

export interface IeltsItem {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    tests?: any[];
}

export interface CreateIeltsDto {
    title: string;
}


export const useGetIeltsList = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['ielts', page, limit],
        queryFn: async () => {
            const { data } = await api.get(`${ieltsEndpoint}?page=${page}&limit=${limit}`);
            return data;
        },
    });
};

export const useGetOneIelts = (id: string) => {
    return useQuery({
        queryKey: ['ielts', id],
        queryFn: async () => {
            const { data } = await api.get(`${ieltsEndpoint}/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateIelts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: CreateIeltsDto) => {
            const { data } = await api.post(ieltsEndpoint, values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ielts'] });
            notification.success({ message: 'Yangi IELTS yaratildi', placement: 'bottomRight' });
        },
        onError: () => {
            notification.error({ message: 'IELTS yaratishda xatolik yuz berdi', placement: 'bottomRight' });
        },
    });
};

export const useUpdateIelts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...values }: CreateIeltsDto & { id: string }) => {
            const { data } = await api.patch(`${ieltsEndpoint}/${id}`, values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ielts'] });
            notification.success({ message: 'IELTS yangilandi', placement: 'bottomRight' });
        },
        onError: () => {
            notification.error({ message: 'IELTS yangilashda xatolik yuz berdi', placement: 'bottomRight' });
        },
    });
};

export const useDeleteIelts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`${ieltsEndpoint}/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ielts'] });
            notification.success({ message: 'IELTS o\'chirildi', placement: 'bottomRight' });
        },
        onError: () => {
            notification.error({ message: 'IELTS o\'chirishda xatolik yuz berdi', placement: 'bottomRight' });
        },
    });
};
