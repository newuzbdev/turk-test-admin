import { describe, it, expect } from 'vitest';
import { QuestionType } from '@/utils/types/types';

// Mock the test data structure
// interface TestData {
//   title: string;
//   description: string;
//   type: "LISTENING" | "READING" | "WRITING";
//   ieltsId: string;
//   parts: Array<{
//     number: number;
//     title: string;
//     audioUrl?: string;
//     sections: Array<{
//       title: string;
//       content?: string;
//       questions: Array<{
//         type: string;
//         question?: string;
//         answers: Array<{
//           answer: string;
//           isCorrect: boolean;
//         }>;
//       }>;
//     }>;
//   }>;
// }

// Extract the variant text generation logic for testing
const generateVariantText = (questionType: string, answerIndex: number): string => {
  switch (questionType) {
    case QuestionType.TRUE_FALSE:
      if (answerIndex === 0) return "True";
      else if (answerIndex === 1) return "False";
      else if (answerIndex === 2) return "Not Given";
      else return "Variant";
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.MULTI_SELECT:
      return String.fromCharCode(65 + answerIndex); // A, B, C, D...
    case QuestionType.MATCHING:
      return `${answerIndex + 1}`; // 1, 2, 3, 4...
    case QuestionType.TEXT_INPUT:
    case QuestionType.FILL_BLANK:
      return "Text";
    default:
      return String.fromCharCode(65 + answerIndex);
  }
};

describe('Test Editor Variant Text Generation', () => {
  it('should generate correct variant text for TRUE_FALSE questions', () => {
    expect(generateVariantText(QuestionType.TRUE_FALSE, 0)).toBe('True');
    expect(generateVariantText(QuestionType.TRUE_FALSE, 1)).toBe('False');
    expect(generateVariantText(QuestionType.TRUE_FALSE, 2)).toBe('Not Given');
    expect(generateVariantText(QuestionType.TRUE_FALSE, 3)).toBe('Variant');
  });

  it('should generate correct variant text for MULTIPLE_CHOICE questions', () => {
    expect(generateVariantText(QuestionType.MULTIPLE_CHOICE, 0)).toBe('A');
    expect(generateVariantText(QuestionType.MULTIPLE_CHOICE, 1)).toBe('B');
    expect(generateVariantText(QuestionType.MULTIPLE_CHOICE, 2)).toBe('C');
    expect(generateVariantText(QuestionType.MULTIPLE_CHOICE, 3)).toBe('D');
  });

  it('should generate correct variant text for MULTI_SELECT questions', () => {
    expect(generateVariantText(QuestionType.MULTI_SELECT, 0)).toBe('A');
    expect(generateVariantText(QuestionType.MULTI_SELECT, 1)).toBe('B');
    expect(generateVariantText(QuestionType.MULTI_SELECT, 2)).toBe('C');
  });

  it('should generate correct variant text for MATCHING questions', () => {
    expect(generateVariantText(QuestionType.MATCHING, 0)).toBe('1');
    expect(generateVariantText(QuestionType.MATCHING, 1)).toBe('2');
    expect(generateVariantText(QuestionType.MATCHING, 2)).toBe('3');
  });

  it('should generate correct variant text for TEXT_INPUT questions', () => {
    expect(generateVariantText(QuestionType.TEXT_INPUT, 0)).toBe('Text');
    expect(generateVariantText(QuestionType.TEXT_INPUT, 1)).toBe('Text');
  });

  it('should generate correct variant text for FILL_BLANK questions', () => {
    expect(generateVariantText(QuestionType.FILL_BLANK, 0)).toBe('Text');
    expect(generateVariantText(QuestionType.FILL_BLANK, 1)).toBe('Text');
  });

  it('should default to A, B, C for unknown question types', () => {
    expect(generateVariantText('UNKNOWN_TYPE', 0)).toBe('A');
    expect(generateVariantText('UNKNOWN_TYPE', 1)).toBe('B');
    expect(generateVariantText('UNKNOWN_TYPE', 2)).toBe('C');
  });
});
