import { z } from "zod";

export const roleSchema = z.enum(["GUEST", "HOST", "ADMIN"]);

export const authUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.email(),
  role: roleSchema,
  image: z.string().nullable(),
  phone: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const authSessionResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authUserSchema,
});

export const loginFormSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or less")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Enter a valid email address"),
  password: passwordRule,
  role: roleSchema,
});

export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type AuthStatus = "loading" | "authenticated" | "anonymous";
export type CurrentUser = z.infer<typeof authUserSchema>;
export type UserRole = z.infer<typeof roleSchema>;
