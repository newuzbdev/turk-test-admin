import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, CreateSection, Section } from '@/utils/types/types'
import { sectionEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useCreateSection = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (data: CreateSection) =>
			(await axiosPrivate.post<ApiResponse<Section>>(sectionEndpoints.all, data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [sectionEndpoints.all] })
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
