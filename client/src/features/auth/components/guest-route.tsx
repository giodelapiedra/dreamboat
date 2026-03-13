import { Navigate, Outlet } from "react-router-dom";

import { LoadingPanel } from "@/components/feedback/loading-panel";
import { useAuthStore } from "../auth-store";

export function GuestRoute(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return <LoadingPanel label="Checking session" />;
  }

  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}
