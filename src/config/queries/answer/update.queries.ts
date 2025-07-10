import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, Answer } from '@/utils/types/types'
import { answerEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useUpdateAnswer = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ id, ...data }: { id: string } & Partial<Answer>) =>
			(await axiosPrivate.patch<ApiResponse<Answer>>(answerEndpoints.one(id), data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [answerEndpoints.all] })
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
