import type { CreateReadingPractice } from '@/utils/types/types';

const pick = (value: object, keys: string[]) => Object.fromEntries(
  keys.filter((key) => Object.hasOwn(value, key)).map((key) => [key, (value as Record<string, unknown>)[key]]),
);

// Read responses contain database metadata that the write DTO deliberately rejects.
export function readingPracticeSavePayload(value: Partial<CreateReadingPractice>) {
  const payload = pick(value, ['title', 'passageTitle', 'description', 'coverImageUrl', 'level', 'price', 'coinCost', 'practiceType', 'sectionNumber', 'isPublished', 'isFreeAccess']);
  if (value.paragraphs !== undefined) payload.paragraphs = value.paragraphs.map((item) => pick(item, ['label', 'title', 'text', 'imageUrl', 'imagePositionX', 'imagePositionY']));
  if (value.glossaryEntries !== undefined) payload.glossaryEntries = value.glossaryEntries.map((item) => pick(item, ['order', 'term', 'definition', 'simpleDefinition', 'baseForm', 'baseMeaning', 'contextMeaning', 'contextSnippet', 'occurrenceIndex', 'translation', 'example', 'paragraphLabel']));
  if (value.questionGroups !== undefined) payload.questionGroups = value.questionGroups.map((group) => ({
    ...pick(group, ['order', 'title', 'instructions', 'type']),
    questions: group.questions.map((question) => pick(question, ['order', 'prompt', 'answerKey', 'options', 'acceptedAnswers', 'explanation', 'evidenceParagraphs', 'meta'])),
  }));
  return payload;
}
