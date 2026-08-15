"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/types";

interface AuthState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      hasRole: (role) => get().user?.roles.includes(role as never) ?? false,
      isAdmin: () => get().user?.roles.includes("ADMIN") ?? false,
    }),
    { name: "sokoflux-auth" }
  )
);
