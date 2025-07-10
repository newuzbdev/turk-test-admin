import axiosPrivate from '@/config/api'
import { examEndpoints } from '@/config/endpoint'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { TPaginationWrapper, ExamResult, UserAnswer } from '@/utils/types/types'

export const useGetAllTestResults = () => {
	const [searchParams] = useSearchParams()
	const search = searchParams.get('search')
	const page = parseInt(searchParams.get('page') || '1')
	const limit = parseInt(searchParams.get('limit') || '10')

	return useQuery({
		queryKey: [examEndpoints.all, search, page, limit],
		queryFn: async () => {
			return (
				await axiosPrivate.get<TPaginationWrapper<ExamResult[]>>(examEndpoints.all, {
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

export const useGetAllUserAnswers = () => {
	const [searchParams] = useSearchParams()
	const search = searchParams.get('search')
	const page = parseInt(searchParams.get('page') || '1')
	const limit = parseInt(searchParams.get('limit') || '10')

	return useQuery({
		queryKey: [examEndpoints.userAnswers, search, page, limit],
		queryFn: async () => {
			return (
				await axiosPrivate.get<TPaginationWrapper<UserAnswer[]>>(examEndpoints.userAnswers, {
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
