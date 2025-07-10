import axiosPrivate from '@/config/api'
import { speakingQuestionEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { TPaginationWrapper, SpeakingQuestion } from '@/utils/types/types'

export const useGetAllSpeakingQuestion = () => {
	const [searchParams] = useSearchParams()
	const search = searchParams.get('search')
	const page = parseInt(searchParams.get('page') || '1')
	const limit = parseInt(searchParams.get('limit') || '10')

	return useQuery({
		queryKey: [speakingQuestionEndpoints.all, search, page, limit],
		queryFn: async () => {
			return (
				await axiosPrivate.get<TPaginationWrapper<SpeakingQuestion[]>>(speakingQuestionEndpoints.all, {
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
