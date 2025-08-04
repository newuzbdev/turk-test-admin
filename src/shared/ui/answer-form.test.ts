import { describe, it, expect } from 'vitest';
import { QuestionType } from '@/utils/types/types';

// Test the logic for variant text suggestions
describe('Answer Form Logic', () => {
  const getVariantPlaceholder = (questionType?: string, answerIndex = 0) => {
    if (!questionType) return "Variant";

    switch (questionType) {
      case QuestionType.TRUE_FALSE:
        if (answerIndex === 0) return "True";
        if (answerIndex === 1) return "False";
        if (answerIndex === 2) return "Not Given";
        return "Variant";
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.MULTI_SELECT:
        return String.fromCharCode(65 + answerIndex); // A, B, C, D...
      case QuestionType.MATCHING:
        return `${answerIndex + 1}`; // 1, 2, 3, 4...
      case QuestionType.TEXT_INPUT:
      case QuestionType.FILL_BLANK:
        return "Text";
      default:
        return "Variant";
    }
  };

  it('should return correct placeholders for TRUE_FALSE questions', () => {
    expect(getVariantPlaceholder(QuestionType.TRUE_FALSE, 0)).toBe('True');
    expect(getVariantPlaceholder(QuestionType.TRUE_FALSE, 1)).toBe('False');
    expect(getVariantPlaceholder(QuestionType.TRUE_FALSE, 2)).toBe('Not Given');
    expect(getVariantPlaceholder(QuestionType.TRUE_FALSE, 3)).toBe('Variant');
  });

  it('should return correct placeholders for MULTIPLE_CHOICE questions', () => {
    expect(getVariantPlaceholder(QuestionType.MULTIPLE_CHOICE, 0)).toBe('A');
    expect(getVariantPlaceholder(QuestionType.MULTIPLE_CHOICE, 1)).toBe('B');
    expect(getVariantPlaceholder(QuestionType.MULTIPLE_CHOICE, 2)).toBe('C');
    expect(getVariantPlaceholder(QuestionType.MULTIPLE_CHOICE, 3)).toBe('D');
  });

  it('should return correct placeholders for MATCHING questions', () => {
    expect(getVariantPlaceholder(QuestionType.MATCHING, 0)).toBe('1');
    expect(getVariantPlaceholder(QuestionType.MATCHING, 1)).toBe('2');
    expect(getVariantPlaceholder(QuestionType.MATCHING, 2)).toBe('3');
  });

  it('should return "Text" for TEXT_INPUT and FILL_BLANK questions', () => {
    expect(getVariantPlaceholder(QuestionType.TEXT_INPUT, 0)).toBe('Text');
    expect(getVariantPlaceholder(QuestionType.FILL_BLANK, 0)).toBe('Text');
  });

  it('should return "Variant" for unknown question types', () => {
    expect(getVariantPlaceholder('UNKNOWN_TYPE', 0)).toBe('Variant');
    expect(getVariantPlaceholder(undefined, 0)).toBe('Variant');
  });
});
