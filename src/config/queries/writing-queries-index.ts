// Writing Test Queries
export { useCreateWritingTest } from './writing/create.queries';
export { useGetAllWritingTests } from './writing/get-all.queries';
export { useGetOneWritingTest } from './writing/get-one.queries';
export { 
  useUpdateWritingTest, 
  useUpdateWritingTestTitle, 
  useUpdateWritingTestInstruction 
} from './writing/update.queries';
export { useDeleteWritingTest } from './writing/delete.queries';

// Writing Section Queries
export { useCreateWritingSection } from './writing-section/create.queries';
export { useGetAllWritingSections } from './writing-section/get-all.queries';
export { useGetOneWritingSection } from './writing-section/get-one.queries';
export { 
  useUpdateWritingSection,
  useUpdateWritingSectionTitle,
  useUpdateWritingSectionDescription,
  useUpdateWritingSectionContent,
  useUpdateWritingSectionOrder
} from './writing-section/update.queries';
export { useDeleteWritingSection } from './writing-section/delete.queries';

// Writing SubPart Queries
export { useCreateWritingSubPart } from './writing-subpart/create.queries';
export { useGetAllWritingSubParts } from './writing-subpart/get-all.queries';
export { useGetOneWritingSubPart } from './writing-subpart/get-one.queries';
export { 
  useUpdateWritingSubPart,
  useUpdateWritingSubPartTitle,
  useUpdateWritingSubPartDescription,
  useUpdateWritingSubPartContent,
  useUpdateWritingSubPartOrder
} from './writing-subpart/update.queries';
export { useDeleteWritingSubPart } from './writing-subpart/delete.queries';

// Writing Question Queries
export { useCreateWritingQuestion } from './writing-question/create.queries';
export { useGetAllWritingQuestions } from './writing-question/get-all.queries';
export { useGetOneWritingQuestion } from './writing-question/get-one.queries';
export { 
  useUpdateWritingQuestion,
  useUpdateWritingQuestionText,
  useUpdateWritingQuestionOrder
} from './writing-question/update.queries';
export { useDeleteWritingQuestion } from './writing-question/delete.queries';
