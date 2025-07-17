import { create } from "zustand";
import type { WritingTest } from "../../../utils/types/types";

interface WritingModalStore {
  open: boolean;
  data: WritingTest | null;
  onOpen: (data?: WritingTest) => void;
  onClose: () => void;
}

export const useWritingModalStore = create<WritingModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
