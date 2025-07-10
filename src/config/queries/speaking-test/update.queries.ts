import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, SpeakingTest } from '@/utils/types/types'
import { speakingTestEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useUpdateSpeakingTest = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ id, ...data }: { id: string } & Partial<SpeakingTest>) =>
			(await axiosPrivate.patch<ApiResponse<SpeakingTest>>(speakingTestEndpoints.one(id), data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] })
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
