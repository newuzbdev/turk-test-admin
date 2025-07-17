import { create } from "zustand";
import type { SpeakingTest } from "@/utils/types/types";

interface SpeakingModalStore {
  open: boolean;
  data: SpeakingTest | null;
  onOpen: (data?: SpeakingTest) => void;
  onClose: () => void;
}

export const useSpeakingModalStore = create<SpeakingModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
