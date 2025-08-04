import axiosPrivate from '@/config/api'
import { writingSubPartEndpoints, writingSectionEndpoints } from '@/config/endpoint'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from "react-hot-toast";

export const useDeleteWritingSubPart = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => (await axiosPrivate.delete(writingSubPartEndpoints.one(id))).data,
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: [writingSubPartEndpoints.all]
			})
			queryClient.invalidateQueries({
				queryKey: [writingSectionEndpoints.all]
			})
			toast.success("Writing subpart muvaffaqiyatli o'chirildi");
		},
		onError: () => {
			toast.error("Writing subpart o'chirishda xatolik yuz berdi");
		}
	})
}
