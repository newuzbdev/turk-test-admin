import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, SpeakingQuestion } from '@/utils/types/types'
import { speakingQuestionEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useUpdateSpeakingQuestion = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ id, ...data }: { id: string } & Partial<SpeakingQuestion>) =>
			(await axiosPrivate.patch<ApiResponse<SpeakingQuestion>>(speakingQuestionEndpoints.one(id), data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [speakingQuestionEndpoints.all] })
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
