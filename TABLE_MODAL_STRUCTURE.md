# Table-Modal Test Creation Structure

This document describes the new table-modal structure for test creation with IELTS selection workflow.

## 🏗️ Architecture Overview

### Workflow
1. **Table View**: Shows existing tests with "Add" button
2. **Modal Step 1**: IELTS selection and basic test info
3. **Modal Step 2**: Full test creation interface
4. **Save**: Returns to table with new test

### Components Structure
```
pages/[listening|reading]/
├── [listening|reading].tsx           # Main page (shows table)
├── utils/
│   └── [type]-modal-store.ts         # Zustand modal state
└── ui/
    ├── [type]-table.tsx              # Table with existing tests
    ├── [type]-modal.tsx              # Modal with 2-step process
    └── [type]-form.tsx               # Test creation form
```

## 🎯 Features

### Table Features
- **List View**: Shows existing listening/reading tests
- **Add Button**: Opens modal for new test creation
- **Edit Button**: Opens modal with existing test data
- **Delete Button**: Removes test (with confirmation)
- **Pagination**: Standard Ant Design pagination
- **Search**: Filter tests by name/description

### Modal Features
- **Two-Step Process**:
  1. IELTS selection + basic info
  2. Full test creation interface
- **IELTS Dropdown**: Select from existing IELTS tests
- **Form Validation**: Required fields validation
- **Responsive**: Full-width for creation step
- **Cancel**: Return to table without saving

### State Management
- **Zustand Stores**: Separate stores for listening/reading modals
- **Modal State**: Open/close, current data, step management
- **Form State**: Local state in form components

## 📁 File Structure

### Listening Components
```typescript
// src/pages/listening/utils/listening-modal-store.ts
interface ListeningModalStore {
  open: boolean;
  data: CreateTestDto | null;
  onOpen: (data?: CreateTestDto) => void;
  onClose: () => void;
}

// src/pages/listening/ui/listening-table.tsx
export const ListeningTable = () => {
  // Table with listening tests
  // Add/Edit/Delete buttons
  // Modal integration
}

// src/pages/listening/ui/listening-modal.tsx
export const ListeningModal = () => {
  // Step 1: IELTS selection + basic info
  // Step 2: Full test creation form
  // Save/Cancel handling
}

// src/pages/listening/ui/listening-form.tsx
export default function ListeningForm({
  initialData?: CreateTestDto;
  onSave?: (data: CreateTestDto) => void;
  onCancel?: () => void;
}) {
  // Test creation interface
  // Props for modal integration
}
```

### Reading Components
```typescript
// Same structure as listening but with reading-specific:
// - Green color scheme (#10b981)
// - Reading icons (📖, BookOutlined)
// - Reading-specific labels and text
// - Image upload instead of audio upload
```

## 🔄 Data Flow

### New Test Creation
1. User clicks "Yangi [Type] Test Qo'shish" button
2. Modal opens with IELTS selection form
3. User selects IELTS and enters basic info
4. Modal switches to full creation interface
5. User creates test structure (parts, sections, questions)
6. User saves test
7. Modal closes, table refreshes

### Edit Existing Test
1. User clicks "Tahrirlash" button on table row
2. Modal opens directly in creation mode with existing data
3. User modifies test structure
4. User saves changes
5. Modal closes, table refreshes

### Cancel/Close
1. User clicks cancel or close button
2. Modal resets to initial state
3. Returns to table view

## 🎨 UI/UX Features

### Table Design
- **Card Layout**: Clean card container
- **Color Coding**: Blue for listening, green for reading
- **Icons**: Consistent iconography (🎧/📖)
- **Status Tags**: Show test type and part count
- **Action Buttons**: Primary/danger styling

### Modal Design
- **Two-Step UI**: Clear step progression
- **Responsive Width**: 600px for step 1, 95% for step 2
- **Header Icons**: Visual test type identification
- **Form Layout**: Vertical form layout with proper spacing

### Form Design
- **Inherited**: Uses existing form components
- **Props Integration**: Accepts initial data and callbacks
- **Cancel Button**: Conditional cancel button for modal mode
- **Save Handling**: Flexible save behavior

## 🔧 Integration Points

### IELTS Selection
```typescript
// Modal fetches IELTS data
const { data: ieltsData } = useGetAllIelts();

// Dropdown with search
<Select showSearch filterOption={...}>
  {ieltsData?.data?.map((ielts) => (
    <Option key={ielts.id} value={ielts.id}>
      {ielts.title}
    </Option>
  ))}
</Select>
```

### Modal State Management
```typescript
// Store usage
const { open, onOpen, onClose, data } = useListeningModalStore();

// Open for new test
onOpen();

// Open for editing
onOpen(existingTestData);

// Close modal
onClose();
```

### Form Props
```typescript
// Modal passes props to form
<ListeningForm
  initialData={testData}
  onSave={handleTestSave}
  onCancel={close}
/>

// Form handles props
const handleSave = () => {
  if (onSave) {
    onSave(testData);  // Modal mode
  } else {
    // Standalone mode
  }
};
```

## 🚀 Usage Examples

### Listening Page
```typescript
// pages/listening/listening.tsx
import { ListeningTable } from "./ui/listening-table";

const Listening = () => {
  return (
    <main>
      <ListeningTable />
    </main>
  );
};
```

### Reading Page
```typescript
// pages/reading/reading.tsx
import { ReadingTable } from "./ui/reading-table";

const Reading = () => {
  return (
    <main>
      <ReadingTable />
    </main>
  );
};
```

## ✅ Benefits

1. **Better UX**: Clear workflow with IELTS selection first
2. **Reusable Forms**: Forms work both standalone and in modals
3. **State Management**: Clean separation with Zustand
4. **Consistent Design**: Same pattern for both test types
5. **Scalable**: Easy to add more test types
6. **Responsive**: Works on different screen sizes

## 🔮 Future Enhancements

- **API Integration**: Connect to real backend endpoints
- **Search/Filter**: Advanced filtering in tables
- **Bulk Operations**: Select multiple tests for bulk actions
- **Export/Import**: Export tests to JSON/Excel
- **Templates**: Pre-built test templates
- **Validation**: Enhanced form validation
- **Notifications**: Success/error notifications
- **Permissions**: Role-based access control
