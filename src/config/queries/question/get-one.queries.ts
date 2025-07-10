import axiosPrivate from '@/config/api'
import { questionEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, Question } from '@/utils/types/types'

export const useGetOneQuestion = (id: string) => {
	return useQuery({
		queryKey: [questionEndpoints.one(id)],
		queryFn: async () => {
			return (await axiosPrivate.get<ApiResponse<Question>>(questionEndpoints.one(id))).data
		},
		enabled: !!id
	})
}
