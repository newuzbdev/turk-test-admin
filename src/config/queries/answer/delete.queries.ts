import axiosPrivate from '@/config/api'
import { answerEndpoints } from '@/config/endpoint'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notification } from 'antd'

export const useDeleteAnswer = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => (await axiosPrivate.delete(answerEndpoints.one(id))).data,
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: [answerEndpoints.all]
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
