import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, SpeakingPoint } from '@/utils/types/types'
import { speakingPointEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useUpdateSpeakingPoint = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ id, ...data }: { id: string } & Partial<SpeakingPoint>) =>
			(await axiosPrivate.patch<ApiResponse<SpeakingPoint>>(speakingPointEndpoints.one(id), data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [speakingPointEndpoints.all] })
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
