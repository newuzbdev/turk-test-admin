import axiosPrivate from '@/config/api'
import { speakingSubPartEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, SpeakingSubPart } from '@/utils/types/types'

export const useGetOneSpeakingSubPart = (id: string) => {
	return useQuery({
		queryKey: [speakingSubPartEndpoints.one(id)],
		queryFn: async () => {
			return (await axiosPrivate.get<ApiResponse<SpeakingSubPart>>(speakingSubPartEndpoints.one(id))).data
		},
		enabled: !!id
	})
}
