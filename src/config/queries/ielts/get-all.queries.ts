import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import axiosPrivate from "@/config/api";
import { ieltsEndpoints } from "@/config/endpoint";
import type { TPaginationWrapper, IELTS } from "@/utils/types/types";

export interface TestAnswerDto {
  id?: string;
  questionId?: string;
  variantText: string;
  answer: string;
  correct: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestQuestionDto {
  id?: string;
  sectionId?: string;
  number: number;
  type: string;
  title?: string;
  text: string;
  answers: TestAnswerDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestSectionDto {
  id?: string;
  partId?: string;
  title: string;
  content: string;
  imageUrl: string;
  hasBullets?: boolean;
  questions: TestQuestionDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestPartDto {
  id?: string;
  testId?: string;
  number: number;
  title: string;
  audioUrl: string;
  sections: TestSectionDto[];
  createdAt?: string;
  updatedAt?: string;
}
export interface TestPartDtoAudio {
  id?: string;
  number: number;
  title: string;
  sections: TestSectionDto[];
}

export interface TestItem {
  id: string;
  title: string;
  type: string;
  ieltsId: string;
  createdAt: string;
  updatedAt: string;
  parts: TestPartDto[];
}

export interface TestItemAudio {
  id: string;
  title: string;
  type: string;
  ieltsId: string;
  createdAt: string;
  updatedAt: string;
  parts: TestPartDtoAudio[];
}
export interface CreateTestDto {
  id?: string;
  title: string;
  type: string;
  ieltsId: string;
  parts: TestPartDto[];
}

export interface CreateTestDtoAudio {
  title: string;
  type: string;
  ieltsId: string;
  parts: TestPartDtoAudio[];
}

export interface SubmitAnswerDto {
  questionId: string;
  userAnswer: string;
}

export const useGetAllIelts = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return useQuery({
    queryKey: [ieltsEndpoints.all, search, page, limit],
    queryFn: async () => {
      return (
        await axiosPrivate.get<TPaginationWrapper<IELTS[]>>(
          ieltsEndpoints.all,
          {
            params: {
              page,
              limit,
              search,
            },
          }
        )
      ).data;
    },
  });
};
