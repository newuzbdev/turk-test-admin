import axiosPrivate from '@/config/api'
import { useMutation } from '@tanstack/react-query'
import { ApiResponse } from '@/utils/types/types'
import { fileEndpoints } from '@/config/endpoint'
import { notification } from 'antd'

interface FileUploadResponse {
	id: string
	filename: string
	url: string
}

export const useFileUpload = () => {
	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData()
			formData.append('file', file)
			
			return (
				await axiosPrivate.post<ApiResponse<FileUploadResponse>>(
					fileEndpoints.upload,
					formData,
					{
						headers: {
							'Content-Type': 'multipart/form-data'
						}
					}
				)
			).data
		},
		onSuccess: () => {
			notification.success({
				message: 'Fayl muvaffaqiyatli yuklandi',
				placement: 'bottomRight'
			})
		},
		onError: () => {
			notification.error({
				message: 'Fayl yuklashda xatolik yuz berdi',
				placement: 'bottomRight'
			})
		}
	})
}
