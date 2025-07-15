import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

interface Choice {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: "YES_NO_NOT_GIVEN" | "SINGLE_ANSWER" | "T_F_NG";
  instructions: string;
  questionText: string;
  choices: Choice[];
  correctAnswerIds: string[];
  explanation: string;
  locatedPassage: string;
}

interface QuestionGroup {
  id: string;
  name: string;
  questions: { id: string; title: string }[];
}

interface QuestionState {
  questions: Question[];
  questionGroups: QuestionGroup[];
  currentQuestionId: string | null;
  compactGuide: boolean;
  addQuestion: (question: Omit<Question, "id">) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  addChoice: (questionId: string, text: string) => void;
  removeChoice: (questionId: string, choiceId: string) => void;
  setCorrectAnswer: (questionId: string, choiceId: string) => void;
  addQuestionGroup: (name: string) => void;
  addQuestionToGroup: (
    groupId: string,
    questionId: string,
    questionTitle: string
  ) => void;
  setCurrentQuestionId: (id: string | null) => void;
  toggleCompactGuide: () => void;
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  questions: [
    {
      id: "q1",
      type: "YES_NO_NOT_GIVEN",
      instructions:
        "Do the following statements agree with the information given in <Reading Passage Number>? In following statements 27-32 below, choose YES if the statement agrees with the information NO if the statement contradicts the information NOT GIVEN if it is impossible to say what the writer thinks about this",
      questionText: "Let's ask a question",
      choices: [
        { id: "c1", text: "Yes" },
        { id: "c2", text: "No" },
        { id: "c3", text: "Not Given" },
      ],
      correctAnswerIds: ["c3"],
      explanation: "",
      locatedPassage: "",
    },
  ],
  questionGroups: [
    {
      id: "group1",
      name: "SINGLE ANSWER",
      questions: [
        { id: "q1", title: "Question 1" },
        { id: "q2", title: "Question 2" },
        { id: "q3", title: "Question 3" },
        { id: "q4", title: "Question 4" },
      ],
    },
    {
      id: "group2",
      name: "T/F/NG",
      questions: [
        { id: "q5", title: "Question 1" },
        { id: "q6", title: "Question 2" },
        { id: "q7", title: "Question 3" },
      ],
    },
  ],
  currentQuestionId: "q1",
  compactGuide: false,

  addQuestion: (question) =>
    set((state) => {
      const newQuestion = { id: uuidv4(), ...question };
      return { questions: [...state.questions, newQuestion] };
    }),
  updateQuestion: (id, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),
  addChoice: (questionId, text) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId
          ? { ...q, choices: [...q.choices, { id: uuidv4(), text }] }
          : q
      ),
    })),
  removeChoice: (questionId, choiceId) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId
          ? { ...q, choices: q.choices.filter((c) => c.id !== choiceId) }
          : q
      ),
    })),
  setCorrectAnswer: (questionId, choiceId) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              correctAnswerIds: q.correctAnswerIds.includes(choiceId)
                ? q.correctAnswerIds.filter((id) => id !== choiceId)
                : [choiceId],
            }
          : q
      ),
    })),
  addQuestionGroup: (name) =>
    set((state) => ({
      questionGroups: [
        ...state.questionGroups,
        { id: uuidv4(), name, questions: [] },
      ],
    })),
  addQuestionToGroup: (groupId, questionId, questionTitle) =>
    set((state) => ({
      questionGroups: state.questionGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              questions: [
                ...group.questions,
                { id: questionId, title: questionTitle },
              ],
            }
          : group
      ),
    })),
  setCurrentQuestionId: (id) => set({ currentQuestionId: id }),
  toggleCompactGuide: () =>
    set((state) => ({ compactGuide: !state.compactGuide })),
}));
