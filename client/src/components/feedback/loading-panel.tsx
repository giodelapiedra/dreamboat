import { cn } from "@/lib/utils/cn";

interface LoadingPanelProps {
  className?: string;
  label?: string;
}

export function LoadingPanel({ className, label = "Loading" }: LoadingPanelProps): React.JSX.Element {
  return (
    <div className={cn("loading-panel", className)} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
