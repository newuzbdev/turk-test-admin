import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, SpeakingSection } from '@/utils/types/types'
import { speakingSectionEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useUpdateSpeakingSection = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ id, ...data }: { id: string } & Partial<SpeakingSection>) =>
			(await axiosPrivate.patch<ApiResponse<SpeakingSection>>(speakingSectionEndpoints.one(id), data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [speakingSectionEndpoints.all] })
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
