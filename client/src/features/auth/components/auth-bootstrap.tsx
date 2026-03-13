import { useEffect } from "react";

import { LoadingPanel } from "@/components/feedback/loading-panel";

import { refreshSession } from "../auth-api";
import { authStore, useAuthStore } from "../auth-store";

interface AuthBootstrapProps {
  children: React.ReactNode;
}

let bootstrapSessionPromise: Promise<void> | null = null;

function restoreSession(): Promise<void> {
  if (authStore.getState().status !== "loading") {
    return Promise.resolve();
  }

  // React Strict Mode remounts effects in development. Keep refresh single-flight
  // so token rotation does not invalidate the session during app bootstrap.
  if (!bootstrapSessionPromise) {
    bootstrapSessionPromise = refreshSession()
      .then((session) => {
        authStore.getState().setSession(session);
      })
      .catch(() => {
        authStore.getState().setAnonymous();
      })
      .finally(() => {
        bootstrapSessionPromise = null;
      });
  }

  return bootstrapSessionPromise;
}

export function AuthBootstrap({ children }: AuthBootstrapProps): React.JSX.Element {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void restoreSession();
  }, []);

  if (status === "loading") {
    return <LoadingPanel className="page-shell" label="Restoring your session" />;
  }

  return <>{children}</>;
}
