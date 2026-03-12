import { z } from "zod";

const answerValueSchema = z.union([z.string(), z.boolean()]);

const formFieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(["short-text", "email", "phone", "date", "select", "textarea", "boolean"]),
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

export const formStepsSchema = z.array(formStepSchema);
export const answersRecordSchema = z.record(z.string(), answerValueSchema);

export const confirmationTokenParamsSchema = z.object({
  params: z.object({
    token: z.string().trim().min(1),
  }),
});

export const submissionIdParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const submitConfirmationSchema = z.object({
  params: z.object({
    token: z.string().trim().min(1),
  }),
  body: z.object({
    answers: answersRecordSchema,
  }),
});

export const shopifyWebhookSchema = z.object({
  body: z.object({
    formSlug: z.string().trim().min(1).default("guest-confirmation"),
    bookingReference: z.string().trim().min(1).optional(),
    shopifyOrderNumber: z.string().trim().min(1),
    propertyName: z.string().trim().min(1),
    guestName: z.string().trim().min(1).optional(),
    guestEmail: z.email().optional(),
    checkIn: z.string().trim().min(1),
    checkOut: z.string().trim().min(1),
    prefilledAnswers: answersRecordSchema.optional(),
  }),
});
