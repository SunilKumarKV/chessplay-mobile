import { create } from "zustand";
import type { User } from "@/types/api";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  socketToken: string | null;
  authError: string | null;
  hasOnboarded: boolean;
  hydrated: boolean;
  setSession: (session: { user: User; accessToken?: string | null; socketToken?: string | null }) => void;
  setSocketToken: (socketToken: string | null) => void;
  setAuthError: (message: string | null) => void;
  clearSession: () => void;
  setOnboarded: (value: boolean) => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  socketToken: null,
  authError: null,
  hasOnboarded: false,
  hydrated: false,
  setSession: ({ user, accessToken = null, socketToken = null }) =>
    set({ user, accessToken: accessToken || socketToken, socketToken: socketToken || accessToken || null, authError: null }),
  setSocketToken: (socketToken) => set((state) => ({ socketToken, accessToken: state.accessToken || socketToken })),
  setAuthError: (authError) => set({ authError }),
  clearSession: () => set({ user: null, accessToken: null, socketToken: null, authError: null }),
  setOnboarded: (hasOnboarded) => set({ hasOnboarded }),
  setHydrated: (hydrated) => set({ hydrated })
}));
