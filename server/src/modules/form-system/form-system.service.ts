import { Prisma, SubmissionStatus, type Form, type Submission, type SubmissionEvent } from "../../../generated/prisma";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../../lib/http-error";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { answersRecordSchema, formStepsSchema } from "./form-system.schema";

type FormWithSubmissions = Form;
type SubmissionWithRelations = Submission & {
  form: Form;
  timeline: SubmissionEvent[];
};

type AnswersRecord = Record<string, string | boolean>;

type FormSteps = ReturnType<typeof formStepsSchema.parse>;

function parseFormSteps(value: Prisma.JsonValue): FormSteps {
  return formStepsSchema.parse(value);
}

function parseAnswers(value: Prisma.JsonValue): AnswersRecord {
  return answersRecordSchema.parse(value);
}

function isFilled(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value ?? "").trim().length > 0;
}

function deriveGuestName(answers: AnswersRecord): string {
  return String(answers.guest_name ?? answers.full_name ?? "New guest");
}

function deriveGuestEmail(answers: AnswersRecord): string {
  return String(answers.guest_email ?? answers.email ?? "pending@email.com");
}

function buildProgress(steps: FormSteps, answers: AnswersRecord): {
  missingCount: number;
  completionPercent: number;
  status: SubmissionStatus;
} {
  const fields = steps.flatMap((step) => step.fields);
  const requiredFields = fields.filter((field) => field.required);
  const completedFields = fields.filter((field) => isFilled(answers[field.id])).length;
  const missingCount = requiredFields.filter((field) => !isFilled(answers[field.id])).length;
  const completionPercent = fields.length > 0 ? Math.round((completedFields / fields.length) * 100) : 0;

  if (missingCount === 0) {
    return {
      missingCount,
      completionPercent,
      status: SubmissionStatus.COMPLETED,
    };
  }

  if (completedFields === 0) {
    return {
      missingCount,
      completionPercent,
      status: SubmissionStatus.PENDING,
    };
  }

  return {
    missingCount,
    completionPercent,
    status: SubmissionStatus.IN_PROGRESS,
  };
}

function mapStatus(status: SubmissionStatus): "pending" | "in-progress" | "completed" | "needs-review" {
  if (status === SubmissionStatus.IN_PROGRESS) {
    return "in-progress";
  }

  if (status === SubmissionStatus.COMPLETED) {
    return "completed";
  }

  if (status === SubmissionStatus.NEEDS_REVIEW) {
    return "needs-review";
  }

  return "pending";
}

function mapForm(form: FormWithSubmissions) {
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    completionTitle: form.completionTitle,
    completionMessage: form.completionMessage,
    submitLabel: form.submitLabel,
    steps: parseFormSteps(form.steps),
    source: "api" as const,
  };
}

function mapSubmissionSummary(submission: SubmissionWithRelations) {
  return {
    id: submission.id,
    formTitle: submission.form.title,
    guestName: submission.guestName,
    guestEmail: submission.guestEmail,
    status: mapStatus(submission.status),
    completionPercent: submission.completionPercent,
    missingCount: submission.missingCount,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    bookingReference: submission.bookingReference,
    shopifyOrderNumber: submission.shopifyOrderNumber,
    confirmationToken: submission.confirmationToken,
    source: "api" as const,
  };
}

function mapSubmissionDetail(submission: SubmissionWithRelations) {
  return {
    ...mapSubmissionSummary(submission),
    answers: parseAnswers(submission.answers),
    form: mapForm(submission.form),
    linkedBooking: {
      bookingReference: submission.bookingReference,
      shopifyOrderNumber: submission.shopifyOrderNumber,
      propertyName: submission.propertyName,
      checkIn: submission.checkIn,
      checkOut: submission.checkOut,
    },
    timeline: [...submission.timeline]
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
      .map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        occurredAt: event.occurredAt.toISOString(),
      })),
  };
}

async function getActiveFormOrThrow(slug: string): Promise<Form> {
  const form = await prisma.form.findFirst({
    where: {
      slug,
      isActive: true,
    },
  });

  if (!form) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Form not found");
  }

  return form;
}

async function getSubmissionByIdOrThrow(id: string): Promise<SubmissionWithRelations> {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      form: true,
      timeline: true,
    },
  });

  if (!submission) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Submission not found");
  }

  return submission;
}

async function getSubmissionByTokenOrThrow(token: string): Promise<SubmissionWithRelations> {
  const submission = await prisma.submission.findFirst({
    where: { confirmationToken: token },
    include: {
      form: true,
      timeline: true,
    },
  });

  if (!submission) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Confirmation record not found");
  }

  return submission;
}

function assertConfirmationIsAccessible(submission: SubmissionWithRelations): void {
  if (submission.status === SubmissionStatus.COMPLETED) {
    throw new HttpError(
      StatusCodes.GONE,
      "This confirmation link has already been completed and can no longer be used.",
    );
  }
}

export async function getConfirmationPayload(token: string) {
  const submission = await getSubmissionByTokenOrThrow(token);
  assertConfirmationIsAccessible(submission);

  return {
    form: mapForm(submission.form),
    submission: mapSubmissionDetail(submission),
  };
}

export async function submitConfirmation(
  token: string,
  input: {
    answers: AnswersRecord;
  },
) {
  const existing = await getSubmissionByTokenOrThrow(token);
  assertConfirmationIsAccessible(existing);

  const mergedAnswers: AnswersRecord = {
    ...parseAnswers(existing.answers),
    ...input.answers,
  };
  const steps = parseFormSteps(existing.form.steps);
  const progress = buildProgress(steps, mergedAnswers);
  const now = new Date();

  const updateResult = await prisma.submission.updateMany({
    where: {
      id: existing.id,
      confirmationToken: token,
      status: {
        not: SubmissionStatus.COMPLETED,
      },
    },
    data: {
      guestName: deriveGuestName(mergedAnswers),
      guestEmail: deriveGuestEmail(mergedAnswers),
      answers: mergedAnswers,
      status: progress.status,
      completionPercent: progress.completionPercent,
      missingCount: progress.missingCount,
      confirmationToken: progress.status === SubmissionStatus.COMPLETED ? null : token,
      updatedAt: now,
    },
  });

  if (updateResult.count === 0) {
    throw new HttpError(
      StatusCodes.GONE,
      "This confirmation link has already been completed and can no longer be used.",
    );
  }

  await prisma.submissionEvent.create({
    data: {
      submissionId: existing.id,
      title: "Guest response submitted",
      description:
        progress.status === SubmissionStatus.COMPLETED
          ? "The confirmation form was completed from the public link and the token was consumed."
          : "The confirmation form was updated from the public link.",
      occurredAt: now,
    },
  });

  const submission = await getSubmissionByIdOrThrow(existing.id);
  return mapSubmissionDetail(submission);
}

export async function getSubmissionSummaries() {
  const submissions = await prisma.submission.findMany({
    include: {
      form: true,
      timeline: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return submissions.map(mapSubmissionSummary);
}

export async function getSubmissionDetail(id: string) {
  const submission = await getSubmissionByIdOrThrow(id);
  return mapSubmissionDetail(submission);
}

export async function getTrips() {
  const submissions = await prisma.submission.findMany({
    select: {
      propertyName: true,
      checkIn: true,
      checkOut: true,
      status: true,
      answers: true,
    },
    orderBy: { checkIn: "desc" },
  });

  // Group by propertyName + checkIn + checkOut
  const groups = new Map<string, {
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalBookings: number;
    totalGuests: number;
    completedCount: number;
  }>();

  for (const sub of submissions) {
    const key = `${sub.propertyName}|${sub.checkIn}|${sub.checkOut}`;
    let group = groups.get(key);

    if (!group) {
      group = {
        propertyName: sub.propertyName,
        checkIn: sub.checkIn,
        checkOut: sub.checkOut,
        totalBookings: 0,
        totalGuests: 0,
        completedCount: 0,
      };
      groups.set(key, group);
    }

    group.totalBookings += 1;

    const answers = answersRecordSchema.parse(sub.answers);
    const companion = Number(String(answers.companion_count ?? "0"));
    group.totalGuests += isNaN(companion) ? 1 : companion + 1;

    if (sub.status === SubmissionStatus.COMPLETED) {
      group.completedCount += 1;
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const dateA = new Date(a.checkIn).getTime();
    const dateB = new Date(b.checkIn).getTime();
    return dateB - dateA;
  });
}

export async function handleShopifyWebhook(input: {
  formSlug: string;
  bookingReference?: string;
  shopifyOrderNumber: string;
  propertyName: string;
  guestName?: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  prefilledAnswers?: AnswersRecord;
}) {
  const form = await getActiveFormOrThrow(input.formSlug);
  const token = crypto.randomUUID();
  const prefilledAnswers: AnswersRecord = {
    ...(input.prefilledAnswers ?? {}),
  };

  if (input.guestName) {
    prefilledAnswers.guest_name = input.guestName;
  }

  if (input.guestEmail) {
    prefilledAnswers.guest_email = input.guestEmail;
  }

  const steps = parseFormSteps(form.steps);
  const progress = buildProgress(steps, prefilledAnswers);
  const bookingReference = input.bookingReference ?? `DB-${Date.now().toString().slice(-6)}`;

  const submission = await prisma.submission.create({
    data: {
      formId: form.id,
      guestName: deriveGuestName(prefilledAnswers),
      guestEmail: deriveGuestEmail(prefilledAnswers),
      status: progress.status,
      completionPercent: progress.completionPercent,
      missingCount: progress.missingCount,
      bookingReference,
      shopifyOrderNumber: input.shopifyOrderNumber,
      propertyName: input.propertyName,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      answers: prefilledAnswers,
      confirmationToken: token,
      source: "SHOPIFY",
      timeline: {
        create: {
          title: "Shopify webhook received",
          description: "Booking payment event was recorded and a confirmation token was generated.",
          occurredAt: new Date(),
        },
      },
    },
    include: {
      form: true,
      timeline: true,
    },
  });

  return {
    submissionId: submission.id,
    confirmationToken: token,
    confirmationUrl: `${env.CLIENT_URL}/confirm/${token}`,
  };
}

