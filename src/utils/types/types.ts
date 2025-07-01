export interface ApiResponse<T> {
    data: T
    status: number
    pagination: null | {
        page: number
        limit: number
        totalItems: number
        offset: number
        totalPages: number
    }
    date: string
}