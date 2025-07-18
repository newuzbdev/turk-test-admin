import { describe, it, expect } from 'vitest';
import { QuestionType } from './types';

describe('QuestionType Enum', () => {
  it('should have all required question types', () => {
    expect(QuestionType.TEXT_INPUT).toBe('TEXT_INPUT');
    expect(QuestionType.MULTIPLE_CHOICE).toBe('MULTIPLE_CHOICE');
    expect(QuestionType.MULTI_SELECT).toBe('MULTI_SELECT');
    expect(QuestionType.MATCHING).toBe('MATCHING');
    expect(QuestionType.TRUE_FALSE).toBe('TRUE_FALSE');
    expect(QuestionType.FILL_BLANK).toBe('FILL_BLANK');
  });

  it('should have exactly 6 question types', () => {
    const questionTypes = Object.values(QuestionType);
    expect(questionTypes).toHaveLength(6);
  });

  it('should contain all expected values', () => {
    const expectedTypes = [
      'TEXT_INPUT',
      'MULTIPLE_CHOICE', 
      'MULTI_SELECT',
      'MATCHING',
      'TRUE_FALSE',
      'FILL_BLANK'
    ];
    
    const actualTypes = Object.values(QuestionType);
    expect(actualTypes.sort()).toEqual(expectedTypes.sort());
  });
});
