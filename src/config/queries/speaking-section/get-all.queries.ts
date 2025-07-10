import axiosPrivate from '@/config/api'
import { speakingSectionEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { TPaginationWrapper, SpeakingSection } from '@/utils/types/types'

export const useGetAllSpeakingSection = () => {
	const [searchParams] = useSearchParams()
	const search = searchParams.get('search')
	const page = parseInt(searchParams.get('page') || '1')
	const limit = parseInt(searchParams.get('limit') || '10')

	return useQuery({
		queryKey: [speakingSectionEndpoints.all, search, page, limit],
		queryFn: async () => {
			return (
				await axiosPrivate.get<TPaginationWrapper<SpeakingSection[]>>(speakingSectionEndpoints.all, {
					params: {
						page,
						limit,
						search
					}
				})
			).data
		}
	})
}
