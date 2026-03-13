import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { ErrorAlert } from "@/components/feedback/error-alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/features/auth/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { loginFormSchema, type LoginFormValues } from "@/features/auth/auth-types";
import { getErrorMessage } from "@/lib/api/types";

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      setSession(session);
      navigate(redirectTo, { replace: true });
    },
  });

  return (
    <AuthFormShell
      title="Welcome"
      subtitle="Login with Email"
      footer={
        <p>
          Don't have an account? <Link to="/register">Register Now</Link>
        </p>
      }
    >
      <form className="auth-split__form" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" placeholder="Enter your password" {...register("password")} />
        </Field>

        <div className="auth-split__forgot">
          <span />
          <a href="#" className="auth-split__forgot-link">Forgot your password?</a>
        </div>

        {loginMutation.error ? <ErrorAlert message={getErrorMessage(loginMutation.error)} /> : null}

        <Button type="submit" fullWidth disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "LOGIN"}
        </Button>
      </form>
    </AuthFormShell>
  );
}
