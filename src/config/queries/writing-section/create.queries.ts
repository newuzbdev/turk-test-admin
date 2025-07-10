import axiosPrivate from '@/config/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, CreateWritingSection, WritingSection } from '@/utils/types/types'
import { writingSectionEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

export const useCreateWritingSection = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (data: CreateWritingSection) =>
			(await axiosPrivate.post<ApiResponse<WritingSection>>(writingSectionEndpoints.all, data)).data,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] })
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
