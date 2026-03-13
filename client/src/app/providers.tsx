import { QueryClientProvider } from "@tanstack/react-query";

import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap";

import { queryClient } from "./query-client";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  );
}
