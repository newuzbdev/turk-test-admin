import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, CreateAnswer, Answer } from '@/utils/types/types'
import { answerEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useCreateAnswer = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (data: CreateAnswer) =>
			(await axiosPrivate.post<ApiResponse<Answer>>(answerEndpoints.all, data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [answerEndpoints.all] })
			notification.success({
				message: 'Muvaffaqiyatli yaratildi',
				placement: 'bottomRight'
			})
		},
		onError: () => {
			notification.error({
				message: 'Yaratishda xatolik yuz berdi',
				placement: 'bottomRight'
			})
		}
	})
}
