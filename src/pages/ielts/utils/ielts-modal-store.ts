import { create } from "zustand";
import type { IELTS } from "../../../utils/types/types";

interface IeltsModalStore {
  open: boolean;
  data: IELTS | null;
  onOpen: (data?: IELTS) => void;
  onClose: () => void;
}

export const useIeltsModalStore = create<IeltsModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
