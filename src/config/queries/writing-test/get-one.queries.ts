import axiosPrivate from '@/config/api'
import { writingTestEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, WritingTest } from '@/utils/types/types'

export const useGetOneWritingTest = (id: string) => {
	return useQuery({
		queryKey: [writingTestEndpoints.one(id)],
		queryFn: async () => {
			return (await axiosPrivate.get<ApiResponse<WritingTest>>(writingTestEndpoints.one(id))).data
		},
		enabled: !!id
	})
}
