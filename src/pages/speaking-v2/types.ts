export type SpeakingTaskCode = "TASK_1_1" | "TASK_1_2" | "TASK_2" | "TASK_3";

export type SpeakingV2PromptKey =
  | "TASK_1_1_INSTRUCTION"
  | "TASK_1_2_INSTRUCTION"
  | "TASK_2_INSTRUCTION"
  | "TASK_3_INSTRUCTION"
  | "TASK_1_1_Q1"
  | "TASK_1_1_Q2"
  | "TASK_1_1_Q3"
  | "TASK_1_2_Q1"
  | "TASK_1_2_Q2"
  | "TASK_1_2_Q3"
  | "TASK_2_PROMPT"
  | "TASK_3_PROMPT";

export type SpeakingPromptStatus =
  "MISSING" | "GENERATING" | "READY" | "STALE" | "FAILED";

export type SpeakingVisualContextInput = {
  verified: boolean;
  descriptions: Array<{ imageUrl: string; description: string }>;
};

export type SpeakingReadinessIssue = {
  taskCode: SpeakingTaskCode | "TEST";
  field: string;
  message: string;
};

export type SpeakingEditorQuestion = {
  id: string;
  text: string;
  preparationSeconds: number;
  responseSeconds: number;
};

export type SpeakingV2EditorTasks = {
  TASK_1_1: {
    instruction?: string;
    questions: [
      SpeakingEditorQuestion,
      SpeakingEditorQuestion,
      SpeakingEditorQuestion,
    ];
  };
  TASK_1_2: {
    instruction?: string;
    images: [string, string];
    visualContext: SpeakingVisualContextInput;
    questions: [
      SpeakingEditorQuestion,
      SpeakingEditorQuestion,
      SpeakingEditorQuestion,
    ];
  };
  TASK_2: {
    instruction?: string;
    images: [string];
    visualContext: SpeakingVisualContextInput;
    questions: [
      SpeakingEditorQuestion,
      SpeakingEditorQuestion,
      SpeakingEditorQuestion,
    ];
  };
  TASK_3: {
    instruction?: string;
    statement: string;
    advantages: [string, string, string];
    disadvantages: [string, string, string];
  };
};

export type SpeakingV2TasksInput = {
  TASK_1_1: { instruction: string; questions: [string, string, string] };
  TASK_1_2: {
    instruction: string;
    images: [string, string];
    visualContext: SpeakingVisualContextInput;
    questions: [string, string, string];
  };
  TASK_2: {
    instruction: string;
    images: [string];
    visualContext: SpeakingVisualContextInput;
    questions: [string, string, string];
  };
  TASK_3: {
    instruction: string;
    statement: string;
    advantages: [string, string, string];
    disadvantages: [string, string, string];
  };
};

export type SpeakingV2UpdateInput = {
  title: string;
  ieltsId: string;
  expectedUpdatedAt: string;
  tasks: SpeakingV2TasksInput;
};

export type SpeakingV2AdminView = {
  id: string;
  title: string;
  ieltsId: string;
  formatVersion: 2;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  updatedAt: string;
  submissionCount: number;
  activeAttemptCount: number;
  tasks: SpeakingV2EditorTasks;
  audioItems: Array<{
    key: SpeakingV2PromptKey;
    taskCode: SpeakingTaskCode;
    status: SpeakingPromptStatus;
    audioObjectKey: string | null;
    previewUrl: string | null;
    generatedAt: string | null;
    error: string | null;
  }>;
  readiness: { ready: boolean; issues: SpeakingReadinessIssue[] };
};

export type SpeakingV2EditorState = SpeakingV2AdminView;

export type SpeakingV1ArchiveView = {
  id: string;
  title: string;
  ieltsId: string;
  formatVersion: 1;
  status: "ARCHIVED";
  updatedAt: string;
  legacySummary: Array<{
    id: string;
    order: number;
    title: string | null;
    questionCount: number;
  }>;
};

export type SpeakingAdminView = SpeakingV1ArchiveView | SpeakingV2AdminView;

export type SpeakingListRow = {
  isDeleted?: boolean;
  id: string;
  title: string;
  formatVersion: 1 | 2;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  updatedAt: string;
  submissionCount: number;
  ielts: { id: string; title: string };
  completion: null | {
    completedTasks: number;
    totalTasks: 4;
    readyAudio: number;
    totalAudio: 6;
  };
};

export type SpeakingListResponse = {
  data: SpeakingListRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function isSpeakingV2(
  view: SpeakingAdminView,
): view is SpeakingV2AdminView {
  return view.formatVersion === 2;
}

export function toSpeakingV2UpdateInput(
  view: SpeakingV2AdminView,
): SpeakingV2UpdateInput {
  return {
    title: view.title,
    ieltsId: view.ieltsId,
    expectedUpdatedAt: view.updatedAt,
    tasks: stripServerOwnedSpeakingFields(view.tasks),
  };
}

function stripServerOwnedSpeakingFields(
  tasks: SpeakingV2EditorTasks,
): SpeakingV2TasksInput {
  return {
    TASK_1_1: {
      instruction: tasks.TASK_1_1.instruction ?? "",
      questions: tasks.TASK_1_1.questions.map((item) => item.text) as [
        string,
        string,
        string,
      ],
    },
    TASK_1_2: {
      instruction: tasks.TASK_1_2.instruction ?? "",
      images: tasks.TASK_1_2.images,
      visualContext: tasks.TASK_1_2.visualContext,
      questions: tasks.TASK_1_2.questions.map((item) => item.text) as [
        string,
        string,
        string,
      ],
    },
    TASK_2: {
      instruction: tasks.TASK_2.instruction ?? "",
      images: tasks.TASK_2.images,
      visualContext: tasks.TASK_2.visualContext,
      questions: tasks.TASK_2.questions.map((item) => item.text) as [
        string,
        string,
        string,
      ],
    },
    TASK_3: {
      instruction: tasks.TASK_3.instruction ?? "",
      statement: tasks.TASK_3.statement,
      advantages: tasks.TASK_3.advantages,
      disadvantages: tasks.TASK_3.disadvantages,
    },
  };
}

export function getSpeakingV2Completion(
  view: SpeakingV2AdminView,
): Record<SpeakingTaskCode, boolean> {
  const nonEmpty = (value: string) => value.trim().length > 0;
  const normalizeQuestion = (value: string) =>
    value.normalize("NFC").replace(/\s+/g, " ").trim();
  const uniqueNonEmpty = (values: readonly string[]) =>
    values.every(nonEmpty) && new Set(values).size === values.length;
  const questionsReady = (
    questions: readonly SpeakingEditorQuestion[],
    expectedCount: number,
  ) => {
    const normalized = questions.map((item) => normalizeQuestion(item.text));
    return normalized.length === expectedCount && uniqueNonEmpty(normalized);
  };
  const visualReady = (
    images: readonly string[],
    context: SpeakingVisualContextInput,
    expectedImageCount: number,
  ) =>
    images.length === expectedImageCount &&
    uniqueNonEmpty(images) &&
    context.verified &&
    context.descriptions.length === images.length &&
    context.descriptions.every(
      (item) => nonEmpty(item.imageUrl) && nonEmpty(item.description),
    ) &&
    uniqueNonEmpty(context.descriptions.map((item) => item.imageUrl)) &&
    images.every((imageUrl) =>
      context.descriptions.some((item) => item.imageUrl === imageUrl),
    );
  const hasServerStructuralIssue = (taskCode: SpeakingTaskCode) =>
    view.readiness.issues.some(
      (issue) =>
        !issue.field.startsWith("audio.") &&
        (issue.taskCode === taskCode ||
          (issue.taskCode === "TEST" && issue.field === "structure")),
    );

  return {
    TASK_1_1:
      !hasServerStructuralIssue("TASK_1_1") &&
      questionsReady(view.tasks.TASK_1_1.questions, 3),
    TASK_1_2:
      !hasServerStructuralIssue("TASK_1_2") &&
      visualReady(
        view.tasks.TASK_1_2.images,
        view.tasks.TASK_1_2.visualContext,
        2,
      ) &&
      questionsReady(view.tasks.TASK_1_2.questions, 3),
    TASK_2:
      !hasServerStructuralIssue("TASK_2") &&
      visualReady(
        view.tasks.TASK_2.images,
        view.tasks.TASK_2.visualContext,
        1,
      ) &&
      questionsReady(view.tasks.TASK_2.questions, 3),
    TASK_3:
      !hasServerStructuralIssue("TASK_3") &&
      nonEmpty(view.tasks.TASK_3.statement) &&
      view.tasks.TASK_3.advantages.length === 3 &&
      view.tasks.TASK_3.disadvantages.length === 3 &&
      view.tasks.TASK_3.advantages.every(nonEmpty) &&
      view.tasks.TASK_3.disadvantages.every(nonEmpty),
  };
}
