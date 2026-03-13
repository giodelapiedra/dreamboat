import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export function Badge({ children, tone = "neutral" }: BadgeProps): React.JSX.Element {
  return <span className={cn("badge", `badge--${tone}`)}>{children}</span>;
}
