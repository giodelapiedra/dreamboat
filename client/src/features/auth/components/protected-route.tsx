import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingPanel } from "@/components/feedback/loading-panel";

import { useAuthStore } from "../auth-store";
import type { UserRole } from "../auth-types";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps): React.JSX.Element {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status === "loading") {
    return <LoadingPanel className="page-shell" label="Checking access" />;
  }

  if (status !== "authenticated" || !user) {
    return <Navigate replace to="/login" state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
