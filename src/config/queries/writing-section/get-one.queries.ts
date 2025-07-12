import axiosPrivate from '@/config/api'
import { writingSectionEndpoints } from '@/config/endpoint'
import type { ApiResponse, WritingSection } from '@/utils/types/types'
import { useQuery } from '@tanstack/react-query'

export const useGetOneWritingSection = (id: string) => {
	return useQuery({
		queryKey: [writingSectionEndpoints.one(id)],
		queryFn: async () => {
			return (await axiosPrivate.get<ApiResponse<WritingSection>>(writingSectionEndpoints.one(id))).data
		},
		enabled: !!id
	})
}
