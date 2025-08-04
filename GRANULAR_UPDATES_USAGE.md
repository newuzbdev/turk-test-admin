# Writing Granular Update Endpoints Usage Guide

This guide shows how to use the new granular update endpoints for writing entities in your IELTS test system.

## Overview

Instead of updating entire writing entities, you can now update specific parts separately:

- **Writing Tests**: Update title, instruction separately
- **Writing Sections**: Update title, description, content, order separately
- **Writing SubParts**: Update title, description, content, order separately
- **Writing Questions**: Update text, order separately

## Writing Entities

### Writing Test Updates

```typescript
import { 
  useUpdateWritingTestTitle, 
  useUpdateWritingTestInstruction 
} from '@/config/queries/writing/update.queries';

// Update only the title
const updateTitle = useUpdateWritingTestTitle();
updateTitle.mutate({ id: "test-id", title: "New Title" });

// Update only the instruction
const updateInstruction = useUpdateWritingTestInstruction();
updateInstruction.mutate({ id: "test-id", instruction: "New instruction text" });
```

### Writing Section Updates

```typescript
import { 
  useUpdateWritingSectionTitle,
  useUpdateWritingSectionDescription,
  useUpdateWritingSectionContent,
  useUpdateWritingSectionOrder
} from '@/config/queries/writing-section/update.queries';

// Update only section title
const updateSectionTitle = useUpdateWritingSectionTitle();
updateSectionTitle.mutate({ id: "section-id", title: "New Section Title" });

// Update only section description
const updateSectionDescription = useUpdateWritingSectionDescription();
updateSectionDescription.mutate({ id: "section-id", description: "New description" });

// Update only section content
const updateSectionContent = useUpdateWritingSectionContent();
updateSectionContent.mutate({ id: "section-id", content: "New content" });

// Update only section order
const updateSectionOrder = useUpdateWritingSectionOrder();
updateSectionOrder.mutate({ id: "section-id", order: 2 });
```

### Writing SubPart Updates

```typescript
import { 
  useUpdateWritingSubPartTitle,
  useUpdateWritingSubPartDescription,
  useUpdateWritingSubPartContent,
  useUpdateWritingSubPartOrder
} from '@/config/queries/writing-subpart/update.queries';

// Update only subpart title
const updateSubPartTitle = useUpdateWritingSubPartTitle();
updateSubPartTitle.mutate({ id: "subpart-id", title: "New SubPart Title" });

// Update only subpart description
const updateSubPartDescription = useUpdateWritingSubPartDescription();
updateSubPartDescription.mutate({ id: "subpart-id", description: "New description" });
```

### Writing Question Updates

```typescript
import { 
  useUpdateWritingQuestionText,
  useUpdateWritingQuestionOrder
} from '@/config/queries/writing-question/update.queries';

// Update only question text
const updateQuestionText = useUpdateWritingQuestionText();
updateQuestionText.mutate({ id: "question-id", text: "New question text?" });

// Update only question order
const updateQuestionOrder = useUpdateWritingQuestionOrder();
updateQuestionOrder.mutate({ id: "question-id", order: 3 });
```



## Benefits

1. **Performance**: Only update what changed, reducing payload size
2. **Granular Control**: Update specific fields without affecting others
3. **Better UX**: Faster updates and more responsive interface
4. **Conflict Reduction**: Less chance of overwriting concurrent changes
5. **Audit Trail**: Better tracking of what specific fields were changed

## Available Writing Queries

### ✅ Complete CRUD Operations Available

All writing entities now have complete CRUD operations with toast notifications:

#### Writing Test
- ✅ `useCreateWritingTest()` - Create new writing test
- ✅ `useGetAllWritingTests()` - Get all writing tests with pagination
- ✅ `useGetOneWritingTest(id)` - Get single writing test
- ✅ `useUpdateWritingTest()` - General update
- ✅ `useUpdateWritingTestTitle()` - Update only title
- ✅ `useUpdateWritingTestInstruction()` - Update only instruction
- ✅ `useDeleteWritingTest()` - Delete writing test

#### Writing Section
- ✅ `useCreateWritingSection()` - Create new section
- ✅ `useGetAllWritingSections()` - Get all sections with pagination
- ✅ `useGetOneWritingSection(id)` - Get single section
- ✅ `useUpdateWritingSection()` - General update
- ✅ `useUpdateWritingSectionTitle()` - Update only title
- ✅ `useUpdateWritingSectionDescription()` - Update only description
- ✅ `useUpdateWritingSectionContent()` - Update only content
- ✅ `useUpdateWritingSectionOrder()` - Update only order
- ✅ `useDeleteWritingSection()` - Delete section

#### Writing SubPart
- ✅ `useCreateWritingSubPart()` - Create new subpart
- ✅ `useGetAllWritingSubParts()` - Get all subparts with pagination
- ✅ `useGetOneWritingSubPart(id)` - Get single subpart
- ✅ `useUpdateWritingSubPart()` - General update
- ✅ `useUpdateWritingSubPartTitle()` - Update only title
- ✅ `useUpdateWritingSubPartDescription()` - Update only description
- ✅ `useUpdateWritingSubPartContent()` - Update only content
- ✅ `useUpdateWritingSubPartOrder()` - Update only order
- ✅ `useDeleteWritingSubPart()` - Delete subpart

#### Writing Question
- ✅ `useCreateWritingQuestion()` - Create new question
- ✅ `useGetAllWritingQuestions()` - Get all questions with pagination
- ✅ `useGetOneWritingQuestion(id)` - Get single question
- ✅ `useUpdateWritingQuestion()` - General update
- ✅ `useUpdateWritingQuestionText()` - Update only text
- ✅ `useUpdateWritingQuestionOrder()` - Update only order
- ✅ `useDeleteWritingQuestion()` - Delete question

## Easy Import

All writing queries can be imported from a single file:

```typescript
import {
  useDeleteWritingTest,
  useDeleteWritingSection,
  useDeleteWritingSubPart,
  useDeleteWritingQuestion,
  useUpdateWritingSectionTitle,
  useUpdateWritingSubPartContent,
  // ... all other queries
} from '@/config/queries/writing-queries-index';
```

## API Endpoints

The system now supports these specific update endpoints for writing entities:

### Writing
- `PATCH /api/writing-test/{id}/title`
- `PATCH /api/writing-test/{id}/instruction`
- `PATCH /api/writing-section/{id}/title`
- `PATCH /api/writing-section/{id}/description`
- `PATCH /api/writing-section/{id}/content`
- `PATCH /api/writing-section/{id}/order`
- `PATCH /api/writing-sub-part/{id}/title`
- `PATCH /api/writing-sub-part/{id}/description`
- `PATCH /api/writing-sub-part/{id}/content`
- `PATCH /api/writing-sub-part/{id}/order`
- `PATCH /api/writing-question/{id}/text`
- `PATCH /api/writing-question/{id}/order`

### Delete Endpoints
- `DELETE /api/writing-test/{id}`
- `DELETE /api/writing-section/{id}`
- `DELETE /api/writing-sub-part/{id}`
- `DELETE /api/writing-question/{id}`

## Toast Notifications

All queries now use consistent `toast` notifications from `react-hot-toast`:
- ✅ Success messages for all operations
- ✅ Error messages for all operations
- ✅ Consistent Uzbek language messages
