import axiosPrivate from '@/config/api'
import { writingSectionEndpoints, writingTestEndpoints } from '@/config/endpoint'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from "react-hot-toast";

export const useDeleteWritingSection = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => (await axiosPrivate.delete(writingSectionEndpoints.one(id))).data,
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: [writingSectionEndpoints.all]
			})
			queryClient.invalidateQueries({
				queryKey: [writingTestEndpoints.all]
			})
			toast.success("Writing section muvaffaqiyatli o'chirildi");
		},
		onError: () => {
			toast.error("Writing section o'chirishda xatolik yuz berdi");
		}
	})
}
