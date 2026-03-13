import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { ErrorAlert } from "@/components/feedback/error-alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { register as registerAccount } from "@/features/auth/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { registerFormSchema, type RegisterFormValues } from "@/features/auth/auth-types";
import { getErrorMessage } from "@/lib/api/types";

export default function RegisterPage(): React.JSX.Element {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: "GUEST",
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: (session) => {
      setSession(session);
      navigate("/dashboard", { replace: true });
    },
  });

  return (
    <AuthFormShell
      title="Create Account"
      subtitle="Sign up to get started"
      footer={
        <p>
          Already registered? <Link to="/login">Sign in instead</Link>
        </p>
      }
    >
      <form className="auth-split__form" onSubmit={handleSubmit((values) => registerMutation.mutate(values))}>
        <Field label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" placeholder="John Doe" {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="Use at least 8 characters with uppercase, lowercase, and a number.">
          <Input type="password" autoComplete="new-password" placeholder="Create a password" {...register("password")} />
        </Field>
        <Field label="Role" error={errors.role?.message}>
          <Select {...register("role")}>
            <option value="GUEST">Guest</option>
            <option value="HOST">Host</option>
          </Select>
        </Field>
        {registerMutation.error ? <ErrorAlert message={getErrorMessage(registerMutation.error)} /> : null}
        <Button type="submit" fullWidth disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthFormShell>
  );
}
