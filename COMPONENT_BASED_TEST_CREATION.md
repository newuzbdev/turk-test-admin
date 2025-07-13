# Component-Based Test Creation System

This document describes the component-based test creation interface for both Listening and Reading tests with shared logic but separate implementations.

## 🏗️ Architecture

### Base Components (Shared Logic)
- **BasePartForm**: Shared part form logic with test-type specific rendering
- **BaseSectionForm**: Shared section form logic with component injection
- **BaseQuestionForm**: Shared question form logic with type-specific features

### Specific Implementations
- **Listening Components**: Specific implementations for listening tests
- **Reading Components**: Specific implementations for reading tests

## 📁 File Structure

```
src/
├── config/
│   └── querys/
│       └── test-query.ts              # Test DTOs and types
├── shared/
│   └── ui/
│       └── test-creation/
│           ├── base-part-form.tsx     # Base part component
│           ├── base-section-form.tsx  # Base section component
│           └── base-question-form.tsx # Base question component
├── pages/
│   ├── listening/
│   │   ├── listening.tsx
│   │   └── ui/
│   │       ├── listening-form.tsx     # Main listening form
│   │       ├── listening-part-form.tsx
│   │       ├── listening-section-form.tsx
│   │       └── listening-question-form.tsx
│   └── reading/
│       ├── reading.tsx
│       └── ui/
│           ├── reading-form.tsx       # Main reading form
│           ├── reading-part-form.tsx
│           ├── section-form.tsx       # Reading section form
│           └── reading-question-form.tsx
```

## 🎯 Features

### Shared Logic
- **Component Composition**: Base components accept specific implementations as props
- **Type Safety**: Full TypeScript support with proper DTOs
- **Ant Design Integration**: Consistent UI components throughout
- **No Hardcoding**: All text and styling configurable per test type

### Test Type Differences
- **Listening**: 
  - Audio upload functionality
  - Blue color scheme (#1890ff)
  - Audio-specific placeholders and labels
  - 🎧 icons and audio-related UI elements

- **Reading**: 
  - Image upload for passages
  - Green color scheme (#10b981)
  - Reading-specific placeholders and labels
  - 📖 icons and reading-related UI elements

### Question Types
- **MULTIPLE_CHOICE**: Customizable answer options
- **TRUE_FALSE**: Auto-populated with TRUE/FALSE/NOT GIVEN
- **FILL_IN_BLANK**: Text input questions
- **MATCHING**: Matching questions

## 🔧 Component Pattern

### Base Component Pattern
```tsx
interface BaseComponentProps {
  // Common props
  data: DataType;
  onChange: (data: DataType) => void;
  onRemove: () => void;
  testType: "LISTENING" | "READING";
  
  // Injected specific component
  childComponent: React.ComponentType<ChildProps>;
}

export default function BaseComponent({
  // ... props
  childComponent: ChildComponent
}: BaseComponentProps) {
  // Shared logic here
  
  return (
    <div>
      {/* Shared UI */}
      <ChildComponent {...childProps} />
    </div>
  );
}
```

### Specific Implementation Pattern
```tsx
import BaseComponent from "../../../shared/ui/test-creation/base-component";
import SpecificChildComponent from "./specific-child-component";

export default function SpecificComponent(props: Props) {
  return (
    <BaseComponent
      {...props}
      testType="LISTENING" // or "READING"
      childComponent={SpecificChildComponent}
    />
  );
}
```

## 📊 Data Structure

### Test DTOs
```typescript
interface CreateTestDto {
  title: string;
  description: string;
  type: "LISTENING" | "READING";
  ieltsId: string;
  parts: TestPartDto[];
}

interface TestPartDto {
  number: number;
  title: string;
  audioUrl?: string; // Only for listening
  sections: TestSectionDto[];
}

interface TestSectionDto {
  title: string;
  content: string;
  imageUrl?: string; // Only for reading
  questions: TestQuestionDto[];
}

interface TestQuestionDto {
  number: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_BLANK" | "MATCHING";
  text: string;
  answers: TestAnswerDto[];
}

interface TestAnswerDto {
  variantText: string; // A, B, C, D...
  answer: string;
  correct: boolean;
}
```

## 🎨 UI Features

### Dynamic Styling
- **Color Schemes**: Different colors per test type
- **Icons**: Test-type specific icons (🎧 for listening, 📖 for reading)
- **Labels**: Context-appropriate labels and placeholders

### Interactive Elements
- **Add/Remove**: Dynamic addition and removal of parts, sections, questions
- **Auto-numbering**: Automatic renumbering when items are removed
- **Validation**: Form validation and disabled states

### Responsive Design
- **Ant Design Grid**: Responsive layout using Row/Col
- **Card Layout**: Nested card structure for visual hierarchy
- **Gradient Backgrounds**: Modern gradient styling

## 🔄 State Management

### Local State Pattern
Each main form component manages its own state:
```tsx
const [testData, setTestData] = useState<CreateTestDto>({
  title: "",
  description: "",
  type: "LISTENING", // or "READING"
  ieltsId: "",
  parts: [],
});
```

### Update Patterns
- **Immutable Updates**: All state updates use spread operators
- **Cascading Updates**: Changes propagate up through component hierarchy
- **Auto-renumbering**: Items are automatically renumbered when removed

## 🚀 Usage

### Listening Test
```tsx
// pages/listening/listening.tsx
import ListeningForm from "./ui/listening-form";

const Listening = () => {
  return (
    <main>
      <ListeningForm />
    </main>
  );
};
```

### Reading Test
```tsx
// pages/reading/reading.tsx
import ReadingForm from "./ui/reading-form";

const Reading = () => {
  return (
    <main>
      <ReadingForm />
    </main>
  );
};
```

## ✅ Benefits

1. **Code Reuse**: Shared logic in base components
2. **Type Safety**: Full TypeScript support
3. **Maintainability**: Clear separation of concerns
4. **Flexibility**: Easy to extend with new test types
5. **Consistency**: Uniform UI patterns across test types
6. **No Hardcoding**: All content configurable per test type

## 🔮 Future Enhancements

- **API Integration**: Connect to backend endpoints
- **Form Validation**: Add comprehensive validation
- **Drag & Drop**: Reorder questions and answers
- **Templates**: Pre-built question templates
- **Import/Export**: Bulk import/export functionality
