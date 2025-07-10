import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, WritingSubPart } from '@/utils/types/types'
import { writingSubPartEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useUpdateWritingSubPart = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ id, ...data }: { id: string } & Partial<WritingSubPart>) =>
			(await axiosPrivate.patch<ApiResponse<WritingSubPart>>(writingSubPartEndpoints.one(id), data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] })
			notification.success({
				message: 'Muvaffaqiyatli yangilandi',
				placement: 'bottomRight'
			})
		},
		onError: () => {
			notification.error({
				message: 'Yangilashda xatolik yuz berdi',
				placement: 'bottomRight'
			})
		}
	})
}
