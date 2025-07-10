import axiosPrivate from '@/config/api'
import { answerEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, Answer } from '@/utils/types/types'

export const useGetOneAnswer = (id: string) => {
	return useQuery({
		queryKey: [answerEndpoints.one(id)],
		queryFn: async () => {
			return (await axiosPrivate.get<ApiResponse<Answer>>(answerEndpoints.one(id))).data
		},
		enabled: !!id
	})
}
