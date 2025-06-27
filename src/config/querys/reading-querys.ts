import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notification } from 'antd'
import type { ApiResponse } from '../../utils/types/reading-types'
import { readingEndpoints } from '../endpoint'
import { api } from '..'

export interface Position {
    id: string
    createdAt: string
    updatedAt: string
    name: string
    responsible?: string[]
    positionResponsibleId?: string
    isResponsible?: boolean
}

export const useGetPositions = (page: number = 1) => {
    return useQuery({
        queryKey: [readingEndpoints.all, page],
        queryFn: async () => {
            const { data } = await api.get<Position[]>(`${readingEndpoints.all}?limit=99&page=${page}`)
            return data
        }
    })
}

export type CreatePosition = Omit<Position, 'id' | 'createdAt' | 'updatedAt'>

export const useCreatePosition = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreatePosition) =>
            (await api.post<ApiResponse<Position>>(readingEndpoints.all, data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [readingEndpoints.all] })
            notification.success({
                message: 'Lavozim muvaffaqiyatli yaratildi',
                placement: 'bottomRight'
            })
        },
        onError: () => {
            notification.error({
                message: 'Lavozim yaratishda xatolik yuz berdi',
                placement: 'bottomRight'
            })
        }
    })
}

export const useUpdatePosition = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<CreatePosition> & { id: string }) =>
            (await api.patch<ApiResponse<Position>>(readingEndpoints.one(id), data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [readingEndpoints.all] })
            notification.success({
                message: 'Lavozim muvaffaqiyatli yangilandi',
                placement: 'bottomRight'
            })
        },
        onError: () => {
            notification.error({
                message: 'Lavozimni yangilashda xatolik yuz berdi',
                placement: 'bottomRight'
            })
        }
    })
}

export const useDeletePosition = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => (await api.delete(readingEndpoints.one(id))).data,
        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: [readingEndpoints.all]
            })
            notification.success({
                message: "Lavozim muvaffaqiyatli o'chirildi",
                placement: 'bottomRight'
            })
        },
        onError: () => {
            notification.error({
                message: "Lavozimni o'chirishda xatolik yuz berdi",
                placement: 'bottomRight'
            })
        }
    })
}
