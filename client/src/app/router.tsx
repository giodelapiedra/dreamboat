import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import { LoadingPanel } from "@/components/feedback/loading-panel";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { GuestRoute } from "@/features/auth/components/guest-route";
import { ProtectedRoute } from "@/features/auth/components/protected-route";

const ConfirmationPage = lazy(() => import("@/pages/confirmation-page"));
const LoginPage = lazy(() => import("@/pages/login-page"));
const RegisterPage = lazy(() => import("@/pages/register-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const TripsPage = lazy(() => import("@/pages/trips-page"));
const SubmissionDetailPage = lazy(() => import("@/pages/submission-detail-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

function withSuspense(element: React.ReactNode): React.JSX.Element {
  return <Suspense fallback={<LoadingPanel label="Loading page" />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: withSuspense(<LoginPage />),
      },
      {
        path: "/register",
        element: withSuspense(<RegisterPage />),
      },
    ],
  },
  {
    path: "/confirm/:token",
    element: withSuspense(<ConfirmationPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardShell />,
        children: [
          {
            index: true,
            element: withSuspense(<DashboardPage />),
          },
          {
            path: "trips",
            element: withSuspense(<TripsPage />),
          },
          {
            path: "submissions/:submissionId",
            element: withSuspense(<SubmissionDetailPage />),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <AppShell />,
    children: [
      {
        path: "*",
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
]);
