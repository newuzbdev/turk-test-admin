import axiosPrivate from '@/config/api'
import { sectionEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, Section } from '@/utils/types/types'

export const useGetOneSection = (id: string) => {
	return useQuery({
		queryKey: [sectionEndpoints.one(id)],
		queryFn: async () => {
			return (await axiosPrivate.get<ApiResponse<Section>>(sectionEndpoints.one(id))).data
		},
		enabled: !!id
	})
}
