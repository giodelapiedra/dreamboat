import { useState, useCallback, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/app/query-client";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";
import { env } from "@/lib/api/env";
import { cn } from "@/lib/utils/cn";

const sidebarLinks = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    end: true,
  },
  {
    to: "/dashboard/trips",
    label: "Trips",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    end: false,
  },
  {
    to: "/dashboard/history",
    label: "History",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    end: false,
  },
];

function HamburgerIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function DashboardShell(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });

  return (
    <div className="dashboard-shell">
      {sidebarOpen ? (
        <div
          className="dashboard-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      ) : null}

      <aside className={cn("dashboard-sidebar", sidebarOpen && "is-open")}>
        <div className="dashboard-sidebar__header">
          <Link className="brand-mark" to="/">
            <span className="brand-mark__glyph">B</span>
            <span>
              <strong>{env.APP_NAME}</strong>
            </span>
          </Link>
          <button
            type="button"
            className="dashboard-sidebar__close"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="dashboard-sidebar__nav">
          <span className="dashboard-sidebar__section">Menu</span>
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn("dashboard-sidebar__link", isActive && "is-active")
              }
            >
              <span className="dashboard-sidebar__link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-sidebar__footer">
          {user ? (
            <>
              <div className="dashboard-sidebar__user">
                <div className="dashboard-sidebar__avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="dashboard-sidebar__user-info">
                  <strong>{user.name}</strong>
                  <small>{user.role.toLowerCase()}</small>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </Button>
            </>
          ) : null}
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-topbar__toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <HamburgerIcon />
          </button>
          <div className="dashboard-breadcrumb">
            <span>{getBreadcrumb(location.pathname)}</span>
          </div>
        </header>
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getBreadcrumb(pathname: string): string {
  if (pathname.startsWith("/dashboard/submissions/")) {
    return "Submission Detail";
  }

  if (pathname === "/dashboard/history") {
    return "History";
  }

  if (pathname === "/dashboard/trips") {
    return "Trips";
  }

  if (pathname === "/dashboard") {
    return "Overview";
  }

  return "Dashboard";
}
