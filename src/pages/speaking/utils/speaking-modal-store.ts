import { create } from "zustand";

interface SpeakingModalStore {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useSpeakingModalStore = create<SpeakingModalStore>((set) => ({
  open: false,
  onOpen: () => set({ open: true }),
  onClose: () => set({ open: false }),
}));
