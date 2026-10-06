import { readExamListView } from "@/shared/components/exam-list-view";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import axiosPrivate from "@/config/api";
import { ieltsEndpoints } from "@/config/endpoint";
import type { IELTS } from "@/utils/types/types";

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
  return useQuery({
    queryKey: [ieltsEndpoints.all, "package-options"],
    queryFn: async () => {
      type PackageResponse = {
          total: number;
          page: number;
          limit: number;
          ieltsData: IELTS[];
          listeningTests: TestItem[];
          readingTests: TestItem[];
          speakingTests: TestItem[];
          writingTests: TestItem[];
      };
      const limit = 50;
      let page = 1;
      let catalog: PackageResponse | null = null;
      while (true) {
        const { data } = await axiosPrivate.get<PackageResponse>(ieltsEndpoints.all, {
          params: { page, limit },
        });
        if (!catalog) catalog = { ...data };
        else {
          catalog.ieltsData.push(...data.ieltsData);
          catalog.listeningTests.push(...data.listeningTests);
          catalog.readingTests.push(...data.readingTests);
          catalog.writingTests.push(...data.writingTests);
          catalog.speakingTests.push(...data.speakingTests);
        }
        if (data.ieltsData.length < limit) return catalog;
        page += 1;
      }
    },
  });
};

export type AdminIeltsRow = IELTS & {
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  isDeleted: boolean;
};
export const useAdminIeltsList = () => {
  const [params] = useSearchParams();
  const view = readExamListView(params.get("view"));
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);
  const search = params.get("search") || "";
  return useQuery({
    queryKey: [ieltsEndpoints.all, "admin-list", view, page, limit, search],
    queryFn: async () =>
      (
        await axiosPrivate.get<{ ieltsData: AdminIeltsRow[]; total: number }>(
          `${ieltsEndpoints.all}/admin/list`,
          { params: { view, page, limit, search } },
        )
      ).data,
  });
};
