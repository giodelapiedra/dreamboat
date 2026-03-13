import { create } from "zustand";

import type { AuthSessionResponse, AuthStatus, CurrentUser } from "./auth-types";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: CurrentUser | null;
  setSession: (session: AuthSessionResponse) => void;
  setAnonymous: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  accessToken: null,
  user: null,
  setSession: (session) => {
    set({
      status: "authenticated",
      accessToken: session.accessToken,
      user: session.user,
    });
  },
  setAnonymous: () => {
    set({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
  },
  clearSession: () => {
    set({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
  },
}));

export const authStore = {
  getState: useAuthStore.getState,
  setState: useAuthStore.setState,
  subscribe: useAuthStore.subscribe,
};
