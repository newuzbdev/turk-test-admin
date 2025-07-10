import axiosPrivate from '@/config/api'
import { partsEndpoints } from '@/config/endpoint'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notification } from 'antd'

export const useDeletePart = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => (await axiosPrivate.delete(partsEndpoints.one(id))).data,
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: [partsEndpoints.all]
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
