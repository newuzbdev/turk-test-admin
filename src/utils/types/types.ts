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

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
}
