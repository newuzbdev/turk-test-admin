import { create } from "zustand";
import type { CreateTestDto } from "../../../config/querys/test-query";

interface ListeningModalStore {
  open: boolean;
  data: CreateTestDto | null;
  onOpen: (data?: CreateTestDto) => void;
  onClose: () => void;
}

export const useListeningModalStore = create<ListeningModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
