import { create } from "zustand";
import type { Part } from "@/utils/types/types";

interface PartsModalStore {
  open: boolean;
  data: Part | null;
  onOpen: (data?: Part) => void;
  onClose: () => void;
}

export const usePartsModalStore = create<PartsModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
