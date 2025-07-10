import { create } from "zustand";
import type { OnlyTest, Test } from "../../../utils/types/types";

interface TestModalStore {
  open: boolean;
  data: Test | OnlyTest | null;
  onOpen: (data?: Test | OnlyTest) => void;
  onClose: () => void;
}

export const useTestModalStore = create<TestModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));

interface OnlyTestModalStore {
  open: boolean;
  data: OnlyTest | null;
  onOpen: (data?: OnlyTest) => void;
  onClose: () => void;
}

export const useOnlyTestModalStore = create<OnlyTestModalStore>((set) => ({
  open: false,
  data: null,
  onOpen: (data) => set({ open: true, data: data || null }),
  onClose: () => set({ open: false, data: null }),
}));
