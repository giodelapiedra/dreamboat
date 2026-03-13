import { PrismaClient, Role, type Prisma } from "../generated/prisma";

import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const guestConfirmationSteps = [
  {
    id: "step_guest",
    title: "Guest details",
    description: "Verify your personal information so we can prepare everything for your trip.",
    fields: [
      {
        id: "guest_name",
        type: "short-text",
        label: "What's your Full name?",
        helperText: "First and Last Name is required",
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
        id: "guest_age",
        type: "short-text",
        label: "What's your age?",
        helperText: "Please note: We only accept individuals aged 12 and above. Proof of age will be required to proceed.",
        required: true,
        placeholder: "25",
      },
      {
        id: "country",
        type: "short-text",
        label: "Country",
        required: true,
        placeholder: "Philippines",
      },
      {
        id: "whatsapp",
        type: "phone",
        label: "WhatsApp number",
        helperText: "We'll use this to send trip updates and coordinate with you.",
        required: true,
        placeholder: "+63 9xx xxx xxxx",
      },
    ],
  },
  {
    id: "step_booking",
    title: "Booking details",
    description: "Tell us about your group so we can prepare accordingly.",
    fields: [
      {
        id: "companion_count",
        type: "select",
        label: "How many are in your booking other than yourself?",
        helperText: "Choose \"Just Me\" if you're travelling solo.",
        required: true,
        options: [
          { label: "Just Me", value: "0" },
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
          { label: "5", value: "5" },
          { label: "6", value: "6" },
          { label: "7", value: "7" },
          { label: "8", value: "8" },
          { label: "9", value: "9" },
          { label: "10", value: "10" },
        ],
      },
      {
        id: "group_type",
        type: "select",
        label: "What's your group type?",
        required: true,
        options: [
          { label: "Solo", value: "Solo" },
          { label: "Couple", value: "Couple" },
          { label: "Group of friends", value: "Group of friends" },
          { label: "Group of friends, Couple", value: "Group of friends, Couple" },
          { label: "Family", value: "Family" },
        ],
      },
    ],
  },
  {
    id: "step_health",
    title: "Health & dietary",
    description: "Help us ensure everyone's safety and comfort during the trip.",
    fields: [
      {
        id: "allergies",
        type: "select-or-other",
        label: "Do you have any allergies?",
        helperText: "Select one or choose 'Other' to specify.",
        required: true,
        options: [
          { label: "No allergies", value: "No allergies" },
          { label: "Shrimp / Shellfish allergy", value: "Shrimp / Shellfish allergy" },
          { label: "Peanut allergy", value: "Peanut allergy" },
          { label: "Seafood allergy", value: "Seafood allergy" },
          { label: "Dairy / Lactose intolerance", value: "Dairy / Lactose intolerance" },
          { label: "Gluten intolerance", value: "Gluten intolerance" },
          { label: "Egg allergy", value: "Egg allergy" },
          { label: "Other", value: "__other__" },
        ],
      },
      {
        id: "medical_conditions",
        type: "short-text",
        label: "Any medical conditions we should know about?",
        helperText: "Type 'None' if not applicable.",
        required: false,
        placeholder: "None",
      },
      {
        id: "eat_meat",
        type: "select",
        label: "Do you eat meat?",
        required: true,
        options: [
          { label: "YES", value: "YES" },
          { label: "NO", value: "NO" },
        ],
      },
      {
        id: "eat_fish",
        type: "select",
        label: "Do you eat fish?",
        required: true,
        options: [
          { label: "YES", value: "YES" },
          { label: "NO", value: "NO" },
        ],
      },
    ],
  },
  {
    id: "step_extras",
    title: "Final details",
    description: "A few more things to finalize your booking.",
    fields: [
      {
        id: "tshirt",
        type: "short-text",
        label: "T-shirt preference",
        helperText: "Would you like to purchase a souvenir shirt? Type 'no thank you' if not interested.",
        required: false,
        placeholder: "No thank you",
      },
      {
        id: "additional_requests",
        type: "textarea",
        label: "Additional requests",
        required: false,
        placeholder: "Airport pickup, late check-in, special arrangements...",
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
      description: "Hey, we're looking forward to welcoming you. Please fill this out so that we can prepare everything for your trip :)",
      completionTitle: "Thank you! You're all set! 🎉",
      completionMessage: "We've received all your details and everything is looking great. Our team will start preparing for your arrival — expect a message on WhatsApp with your final trip itinerary and meetup details. If anything changes or you have questions, don't hesitate to reach out. We can't wait to welcome you — see you soon!",
      submitLabel: "Submit confirmation",
      steps: guestConfirmationSteps,
      isActive: true,
    },
    create: {
      slug: "guest-confirmation",
      title: "Guest confirmation form",
      description: "Hey, we're looking forward to welcoming you. Please fill this out so that we can prepare everything for your trip :)",
      completionTitle: "Thank you! You're all set! 🎉",
      completionMessage: "We've received all your details and everything is looking great. Our team will start preparing for your arrival — expect a message on WhatsApp with your final trip itinerary and meetup details. If anything changes or you have questions, don't hesitate to reach out. We can't wait to welcome you — see you soon!",
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
