import axiosPrivate from '@/config/api'
import { partsEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, Part } from '@/utils/types/types'

export const useGetOnePart = (id: string) => {
	return useQuery({
		queryKey: [partsEndpoints.one(id)],
		queryFn: async () => {
			return (await axiosPrivate.get<ApiResponse<Part>>(partsEndpoints.one(id))).data
		},
		enabled: !!id
	})
}
