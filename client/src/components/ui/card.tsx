import { cn } from "@/lib/utils/cn";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps): React.JSX.Element {
  return <div className={cn("surface-card", className)}>{children}</div>;
}
