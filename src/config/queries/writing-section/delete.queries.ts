import axiosPrivate from '@/config/api'
import { writingSectionEndpoints } from '@/config/endpoint'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notification } from 'antd'

export const useDeleteWritingSection = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => (await axiosPrivate.delete(writingSectionEndpoints.one(id))).data,
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: [writingSectionEndpoints.all]
			})
			notification.success({
				message: "Muvaffaqiyatli o'chirildi",
				placement: 'bottomRight'
			})
		},
		onError: () => {
			notification.error({
				message: "O'chirishda xatolik yuz berdi",
				placement: 'bottomRight'
			})
		}
	})
}
