import { create } from "zustand";
import type { Section } from "@/utils/types/types";

interface SectionsModalStore {
  open: boolean;
  data: Section | null;
  onOpen: (data?: Section) => void;
  onClose: () => void;
}

export const useSectionsModalStore = create<SectionsModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
