# IELTS Test Admin - Queries & Components Structure

This document outlines the complete structure of queries and components for the IELTS Test Admin application.

## 📁 Project Structure

```
src/
├── config/
│   ├── api.ts                 # Axios configuration with interceptors
│   ├── endpoint.ts            # All API endpoints
│   └── queries/               # React Query hooks
│       ├── index.ts           # Export all queries
│       ├── ielts/             # IELTS queries
│       ├── test/              # Test queries
│       ├── parts/             # Parts queries
│       ├── section/           # Section queries
│       ├── question/          # Question queries
│       ├── answer/            # Answer queries
│       ├── exam/              # Exam queries
│       ├── speaking-test/     # Speaking Test queries
│       ├── speaking-section/  # Speaking Section queries
│       ├── speaking-sub-part/ # Speaking SubPart queries
│       ├── speaking-question/ # Speaking Question queries
│       ├── speaking-point/    # Speaking Point queries
│       ├── file/              # File upload queries
│       ├── writing-test/      # Writing Test queries
│       ├── writing-section/   # Writing Section queries
│       └── writing-sub-part/  # Writing SubPart queries
├── pages/
│   ├── index.ts               # Export all pages
│   ├── ielts/                 # IELTS pages
│   ├── test/                  # Test pages
│   ├── parts/                 # Parts pages
│   └── sections/              # Sections pages
└── utils/types/
    └── types.ts               # TypeScript interfaces
```

## 🔧 Query Structure

Each entity follows the same pattern with 5 query files:

### Standard CRUD Operations
- **create.queries.ts** - POST operations
- **delete.queries.ts** - DELETE operations  
- **get-all.queries.ts** - GET all with pagination
- **get-one.queries.ts** - GET single item
- **update.queries.ts** - PATCH operations

### Example Usage

```typescript
// Import queries
import { 
  useGetAllIelts, 
  useCreateIelts, 
  useUpdateIelts, 
  useDeleteIelts 
} from '@/config/queries/ielts/create.queries'

// Use in component
const { data: ielts, isLoading } = useGetAllIelts()
const createIelts = useCreateIelts()
const updateIelts = useUpdateIelts()
const deleteIelts = useDeleteIelts()
```

## 🎯 Available Entities & Endpoints

### Core Entities
- **IELTS** - `/api/ielts`
- **Test** - `/api/test` (with `/api/test/only` variant)
- **Parts** - `/api/parts`
- **Section** - `/api/section`
- **Question** - `/api/question`
- **Answer** - `/api/answer`
- **Exam** - `/api/exam` (submit, results, user answers)

### Speaking Entities
- **Speaking Test** - `/api/speaking-test` (with `/api/speaking-test/only` variant)
- **Speaking Section** - `/api/speaking-section`
- **Speaking SubPart** - `/api/speaking-sub-part`
- **Speaking Question** - `/api/speaking-question`
- **Speaking Point** - `/api/speaking-point`

### Writing Entities
- **Writing Test** - `/api/writing-test`
- **Writing Section** - `/api/writing-section`
- **Writing SubPart** - `/api/writing-sub-part`

### Utility
- **File Upload** - `/api/file/upload`

## 🎨 Component Structure

Each page follows this pattern:

```
pages/entity/
├── entity.tsx              # Main page component
├── entity-table.tsx        # Table component
├── utils/
│   └── entity-modal-store.ts # Zustand store for modal state
└── ui/
    ├── entity-columns.tsx   # Table columns component
    ├── entity-modal.tsx     # Modal component
    └── entity-form.tsx      # Form component
```

### Example Component Usage

```typescript
// Main page
import { IeltsTable } from "./ielts-table";

const Ielts = () => {
  return (
    <main>
      <IeltsTable />
    </main>
  );
};
```

## 🔄 State Management

### Zustand Stores
Each entity has a modal store for managing modal state:

```typescript
interface EntityModalStore {
  open: boolean;
  data: Entity | null;
  onOpen: (data?: Entity) => void;
  onClose: () => void;
}
```

## 📝 TypeScript Types

All types are defined in `src/utils/types/types.ts`:

- **Interfaces** for each entity
- **Create types** that omit `id`, `createdAt`, `updatedAt`
- **API response types** with proper pagination
- **Pagination wrapper types**

## 🚀 Features

### ✅ Implemented Features
- Complete CRUD operations for all entities
- React Query with caching and invalidation
- Zustand for modal state management
- Ant Design components with proper styling
- TypeScript with full type safety
- Pagination support
- Search functionality ready
- Error handling with notifications
- Loading states
- Modular component structure

### 🎯 Key Benefits
- **Consistent patterns** across all entities
- **Type safety** throughout the application
- **Reusable components** and hooks
- **Optimistic updates** with React Query
- **Automatic cache invalidation**
- **Error boundaries** and proper error handling

## 🛠 Setup & Configuration

### Path Aliases
Configured in `vite.config.ts` and `tsconfig.app.json`:
```typescript
"@/*": ["./src/*"]
```

### API Configuration
- Base URL from environment variables
- Automatic token refresh
- Request/response interceptors
- Error handling

## 📚 Usage Examples

### Creating a new entity page
1. Create query files following the pattern
2. Create page components following the structure
3. Add to routing configuration
4. Export from index files

### Adding new endpoints
1. Add to `src/config/endpoint.ts`
2. Create corresponding query files
3. Add TypeScript interfaces
4. Create UI components if needed

This structure provides a solid foundation for the IELTS Test Admin application with consistent patterns, type safety, and excellent developer experience.
