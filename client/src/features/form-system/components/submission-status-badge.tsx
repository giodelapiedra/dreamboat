import type { SubmissionStatus } from "../form-system-types";
import { cn } from "@/lib/utils/cn";

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
}

const statusConfig: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "status-badge--neutral" },
  "in-progress": { label: "In progress", className: "status-badge--neutral" }, // Or primary if I add it
  completed: { label: "Completed", className: "status-badge--success" },
  "needs-review": { label: "Needs review", className: "status-badge--warning" },
};

export function SubmissionStatusBadge({ status }: SubmissionStatusBadgeProps): React.JSX.Element {
  const config = statusConfig[status];
  return (
    <span className={cn("status-badge", config.className)}>
      {config.label}
    </span>
  );
}
