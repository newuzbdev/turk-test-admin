import { create } from "zustand";
import type { Test } from "@/utils/types/types";

interface ListeningModalStore {
  open: boolean;
  data: Test | null;
  onOpen: (data?: Test) => void;
  onClose: () => void;
}

export const useListeningModalStore = create<ListeningModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
