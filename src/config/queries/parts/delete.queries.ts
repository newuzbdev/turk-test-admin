import axiosPrivate from '@/config/api'
import { partsEndpoints } from '@/config/endpoint'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from "react-hot-toast";

export const useDeletePart = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => (await axiosPrivate.delete(partsEndpoints.one(id))).data,
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: [partsEndpoints.all]
			})
			toast.success("Muvaffaqiyatli o'chirildi");
		},
		onError: () => {
			toast.error("O'chirishda xatolik yuz berdi");
		}
	})
}
