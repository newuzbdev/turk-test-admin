import axiosPrivate from '@/config/api'
import { writingQuestionEndpoints, writingSectionEndpoints, writingSubPartEndpoints } from '@/config/endpoint'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from "react-hot-toast";

export const useDeleteWritingQuestion = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => (await axiosPrivate.delete(writingQuestionEndpoints.one(id))).data,
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: [writingQuestionEndpoints.all]
			})
			queryClient.invalidateQueries({
				queryKey: [writingSectionEndpoints.all]
			})
			queryClient.invalidateQueries({
				queryKey: [writingSubPartEndpoints.all]
			})
			toast.success("Writing question muvaffaqiyatli o'chirildi");
		},
		onError: () => {
			toast.error("Writing question o'chirishda xatolik yuz berdi");
		}
	})
}
