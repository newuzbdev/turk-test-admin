import axiosPrivate from '@/config/api'
import { answerEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { TPaginationWrapper, Answer } from '@/utils/types/types'

export const useGetAllAnswer = () => {
	const [searchParams] = useSearchParams()
	const search = searchParams.get('search')
	const page = parseInt(searchParams.get('page') || '1')
	const limit = parseInt(searchParams.get('limit') || '10')

	return useQuery({
		queryKey: [answerEndpoints.all, search, page, limit],
		queryFn: async () => {
			return (
				await axiosPrivate.get<TPaginationWrapper<Answer[]>>(answerEndpoints.all, {
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
