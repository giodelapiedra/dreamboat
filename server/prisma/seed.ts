import { PrismaClient, Role, type Prisma } from "../generated/prisma";

import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const guestConfirmationSteps = [
  {
    id: "step_guest",
    title: "Guest details",
    description: "Verify the main traveller and contact information.",
    fields: [
      {
        id: "guest_name",
        type: "short-text",
        label: "Full name",
        required: true,
        placeholder: "Juan Dela Cruz",
      },
      {
        id: "guest_email",
        type: "email",
        label: "Email address",
        required: true,
        placeholder: "guest@email.com",
      },
      {
        id: "guest_phone",
        type: "phone",
        label: "Mobile number",
        required: true,
        placeholder: "+63 9xx xxx xxxx",
      },
    ],
  },
  {
    id: "step_trip",
    title: "Trip essentials",
    description: "Capture the information your team still needs before arrival.",
    fields: [
      {
        id: "arrival_time",
        type: "short-text",
        label: "Expected arrival time",
        required: true,
        placeholder: "4:30 PM",
      },
      {
        id: "guest_count",
        type: "short-text",
        label: "Final guest count",
        required: true,
        placeholder: "2 adults",
      },
      {
        id: "special_occasion",
        type: "select",
        label: "Purpose of stay",
        required: true,
        options: [
          { label: "Leisure", value: "leisure" },
          { label: "Celebration", value: "celebration" },
          { label: "Business", value: "business" },
        ],
      },
    ],
  },
  {
    id: "step_final",
    title: "Final notes",
    description: "Any extra information that will help your team prepare the booking.",
    fields: [
      {
        id: "special_requests",
        type: "textarea",
        label: "Special requests",
        required: false,
        placeholder: "Airport pickup, late check-in, dietary notes...",
      },
      {
        id: "accept_terms",
        type: "boolean",
        label: "I confirm that the submitted information is accurate.",
        required: true,
      },
    ],
  },
] satisfies Prisma.JsonArray;

async function upsertConfirmationForm(): Promise<void> {
  await prisma.form.upsert({
    where: { slug: "guest-confirmation" },
    update: {
      title: "Guest confirmation form",
      description: "Complete the missing guest details from your booking so operations can finalize the stay.",
      completionTitle: "Confirmation complete",
      completionMessage: "Your details were submitted successfully. The operations team can now review your stay record.",
      submitLabel: "Submit confirmation",
      steps: guestConfirmationSteps,
      isActive: true,
    },
    create: {
      slug: "guest-confirmation",
      title: "Guest confirmation form",
      description: "Complete the missing guest details from your booking so operations can finalize the stay.",
      completionTitle: "Confirmation complete",
      completionMessage: "Your details were submitted successfully. The operations team can now review your stay record.",
      submitLabel: "Submit confirmation",
      steps: guestConfirmationSteps,
      isActive: true,
    },
  });
}

async function main(): Promise<void> {
  const password = await hashPassword("Dreamboat123!");

  await prisma.user.upsert({
    where: { email: "admin@dreamboat.local" },
    update: {},
    create: {
      name: "Dreamboat Admin",
      email: "admin@dreamboat.local",
      password,
      role: Role.ADMIN,
    },
  });

  await upsertConfirmationForm();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
