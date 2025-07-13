// Test creation DTOs
export interface TestPartDto {
  number: number;
  title: string;
  audioUrl?: string; // For listening tests
  sections: TestSectionDto[];
}

export interface TestSectionDto {
  title: string;
  content: string;
  imageUrl?: string;
  questions: TestQuestionDto[];
}

export interface TestQuestionDto {
  number: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_BLANK" | "MATCHING";
  text: string;
  answers: TestAnswerDto[];
}

export interface TestAnswerDto {
  variantText: string;
  answer: string;
  correct: boolean;
}

export interface CreateTestDto {
  id: boolean;
  title: string;
  description: string;
  type: "LISTENING" | "READING";
  ieltsId: string;
  parts: TestPartDto[];
}
