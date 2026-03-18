import { Link, NavLink, Outlet } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/app/query-client";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";
import { env } from "@/lib/api/env";
import { cn } from "@/lib/utils/cn";

const baseLinks: { to: string; label: string }[] = [];

export function AppShell(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const clearSession = useAuthStore((state) => state.clearSession);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });

  const navigationLinks = [
    ...baseLinks,
    ...(status === "authenticated" ? [{ to: "/dashboard", label: "Workspace" }] : []),
  ];

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand-mark" to="/">
            <span className="brand-mark__glyph">B</span>
            <span>
              <strong>{env.APP_NAME}</strong>
              <small>Guest confirmation workspace</small>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                className={({ isActive }) => cn("site-nav__link", isActive && "is-active")}
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            {status === "authenticated" && user ? (
              <>
                <div className="user-pill">
                  <span>{user.name}</span>
                  <small>{user.role.toLowerCase()}</small>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </Button>
              </>
            ) : (
              <Link className="button button--primary" to="/login">
                Team login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div>
            <strong>{env.APP_NAME}</strong>
            <p>Internal workspace for Shopify-triggered confirmations and guest detail collection.</p>
          </div>
          <div>
            <p>Shopify creates the record first, then the guest completes only the missing details.</p>
            <p>Your team reviews progress, answers, and follow-ups from one dashboard.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
