import { create } from "zustand";
import type { Test } from "../../../utils/types/types";

interface ReadingModalStore {
  open: boolean;
  data: Test | null;
  onOpen: (data?: Test) => void;
  onClose: () => void;
}

export const useReadingModalStore = create<ReadingModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
