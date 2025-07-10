import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, CreateQuestion, Question } from '@/utils/types/types'
import { questionEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useCreateQuestion = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (data: CreateQuestion) =>
			(await axiosPrivate.post<ApiResponse<Question>>(questionEndpoints.all, data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [questionEndpoints.all] })
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
