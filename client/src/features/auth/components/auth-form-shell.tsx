interface AuthFormShellProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthFormShell({
  title,
  subtitle,
  footer,
  children,
}: AuthFormShellProps): React.JSX.Element {
  return (
    <div className="auth-split">
      <aside className="auth-split__hero">
        <div className="auth-split__hero-overlay" />
        <div className="auth-split__hero-content">
          <h1 className="auth-split__brand">Big Dream Boatman</h1>
          <p className="auth-split__tagline">
            Your booking confirmation workspace — built for teams managing
            Shopify-created bookings and guest details.
          </p>
        </div>
      </aside>

      <main className="auth-split__form-side">
        <div className="auth-split__form-wrapper">
          <div className="auth-split__form-header">
            <h2 className="auth-split__title">{title}</h2>
            <p className="auth-split__subtitle">{subtitle}</p>
          </div>

          {children}

          <div className="auth-split__footer">{footer}</div>
        </div>
      </main>
    </div>
  );
}
