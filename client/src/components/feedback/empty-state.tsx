interface EmptyStateProps {
  title: string;
  message: string;
  label?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, label = "No results", action }: EmptyStateProps): React.JSX.Element {
  return (
    <section className="empty-state surface-card">
      <span className="eyebrow">{label}</span>
      <h2>{title}</h2>
      <p>{message}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </section>
  );
}
