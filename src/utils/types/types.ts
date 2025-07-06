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


export interface SpeakingSubQuestion {
  order: number;
  question: string;
}

export interface SpeakingSubPart {
  label: string;
  description: string;
  questions: SpeakingSubQuestion[];
}

export interface SpeakingSection {
  order: number;
  type: string;
  title: string;
  description?: string;
  content?: string;
  images: string[];
  advantages: string[];
  disadvantages: string[];
  subParts: SpeakingSubPart[];
  questions: SpeakingSubQuestion[];
}

export interface SpeakingTest {
  id: string;
  title: string;
  ieltsId: string;
  createdAt: string;
  updatedAt: string;
  sections: SpeakingSection[];
}

export type CreateSpeakingTest = Omit<SpeakingTest, "id" | "createdAt" | "updatedAt">;
