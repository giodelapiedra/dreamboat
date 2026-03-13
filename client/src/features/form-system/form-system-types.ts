import { z } from "zod";

export const answerValueSchema = z.union([z.string(), z.boolean()]);

export const formFieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(["short-text", "email", "phone", "date", "select", "select-or-other", "textarea", "boolean"]),
  label: z.string(),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(formFieldOptionSchema).optional(),
});

export const formStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  fields: z.array(formFieldSchema),
});

export const formDefinitionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  completionTitle: z.string(),
  completionMessage: z.string(),
  submitLabel: z.string(),
  steps: z.array(formStepSchema),
  source: z.enum(["api", "fallback"]).default("api"),
});

export const linkedBookingSchema = z.object({
  bookingReference: z.string(),
  shopifyOrderNumber: z.string(),
  propertyName: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
});

export const submissionStatusSchema = z.enum(["pending", "in-progress", "completed", "needs-review"]);

export const submissionSummarySchema = z.object({
  id: z.string(),
  formTitle: z.string(),
  guestName: z.string(),
  guestEmail: z.string(),
  status: submissionStatusSchema,
  completionPercent: z.number().min(0).max(100),
  missingCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  bookingReference: z.string(),
  shopifyOrderNumber: z.string(),
  confirmationToken: z.string().nullable().default(null),
  source: z.enum(["api", "fallback"]).default("api"),
});

export const submissionTimelineEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  occurredAt: z.string(),
});

export const submissionDetailSchema = submissionSummarySchema.extend({
  answers: z.record(z.string(), answerValueSchema),
  form: formDefinitionSchema,
  linkedBooking: linkedBookingSchema,
  timeline: z.array(submissionTimelineEventSchema),
});

export const confirmationPayloadSchema = z.object({
  form: formDefinitionSchema,
  submission: submissionDetailSchema,
});

export type AnswerValue = z.infer<typeof answerValueSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FormStep = z.infer<typeof formStepSchema>;
export type FormDefinition = z.infer<typeof formDefinitionSchema>;
export type SubmissionSummary = z.infer<typeof submissionSummarySchema>;
export type SubmissionDetail = z.infer<typeof submissionDetailSchema>;
export type ConfirmationPayload = z.infer<typeof confirmationPayloadSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
