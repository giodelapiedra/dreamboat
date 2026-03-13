import type { FormDefinition, SubmissionDetail, SubmissionSummary } from "./form-system-types";

const guestConfirmationForm: FormDefinition = {
  id: "form_guest_confirmation",
  slug: "guest-confirmation",
  title: "Guest confirmation form",
  description: "Complete the missing guest details from your booking so operations can finalize the stay.",
  completionTitle: "Confirmation complete",
  completionMessage: "Your details were submitted successfully. The operations team can now review your stay record.",
  submitLabel: "Submit confirmation",
  source: "fallback",
  steps: [
    {
      id: "step_guest",
      title: "Guest details",
      description: "Verify the main traveller and contact information.",
      fields: [
        { id: "guest_name", type: "short-text", label: "Full name", required: true, placeholder: "Juan Dela Cruz" },
        { id: "guest_email", type: "email", label: "Email address", required: true, placeholder: "guest@email.com" },
        { id: "guest_phone", type: "phone", label: "Mobile number", required: true, placeholder: "+63 9xx xxx xxxx" },
      ],
    },
    {
      id: "step_trip",
      title: "Trip essentials",
      description: "Capture the information your team still needs before arrival.",
      fields: [
        { id: "arrival_time", type: "short-text", label: "Expected arrival time", required: true, placeholder: "4:30 PM" },
        { id: "guest_count", type: "short-text", label: "Final guest count", required: true, placeholder: "2 adults" },
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
        { id: "special_requests", type: "textarea", label: "Special requests", required: false, placeholder: "Airport pickup, late check-in, dietary notes..." },
        { id: "accept_terms", type: "boolean", label: "I confirm that the submitted information is accurate.", required: true },
      ],
    },
  ],
};

const mockSubmissionsStore: SubmissionDetail[] = [
  {
    id: "sub_001",
    formTitle: guestConfirmationForm.title,
    guestName: "Andrea Santos",
    guestEmail: "andrea.santos@email.com",
    status: "in-progress",
    completionPercent: 67,
    missingCount: 3,
    createdAt: "2026-03-10T09:30:00.000Z",
    updatedAt: "2026-03-12T06:15:00.000Z",
    bookingReference: "DB-24018",
    shopifyOrderNumber: "#5123",
    confirmationToken: "mock-token-001",
    source: "fallback",
    form: guestConfirmationForm,
    linkedBooking: {
      bookingReference: "DB-24018",
      shopifyOrderNumber: "#5123",
      propertyName: "Seabreeze Suites",
      checkIn: "2026-04-06",
      checkOut: "2026-04-09",
    },
    answers: {
      guest_name: "Andrea Santos",
      guest_email: "andrea.santos@email.com",
      guest_phone: "",
      arrival_time: "",
      guest_count: "2",
      special_occasion: "leisure",
      special_requests: "Late arrival around evening.",
      accept_terms: false,
    },
    timeline: [
      {
        id: "event_1",
        title: "Shopify webhook received",
        description: "Booking payment event was recorded and a confirmation token was generated.",
        occurredAt: "2026-03-10T09:30:00.000Z",
      },
      {
        id: "event_2",
        title: "Confirmation link opened",
        description: "Guest started filling the missing booking details.",
        occurredAt: "2026-03-12T06:15:00.000Z",
      },
    ],
  },
  {
    id: "sub_002",
    formTitle: guestConfirmationForm.title,
    guestName: "Marco Lim",
    guestEmail: "marco@email.com",
    status: "completed",
    completionPercent: 100,
    missingCount: 0,
    createdAt: "2026-03-09T04:20:00.000Z",
    updatedAt: "2026-03-09T05:05:00.000Z",
    bookingReference: "DB-24012",
    shopifyOrderNumber: "#5110",
    confirmationToken: null,
    source: "fallback",
    form: guestConfirmationForm,
    linkedBooking: {
      bookingReference: "DB-24012",
      shopifyOrderNumber: "#5110",
      propertyName: "Azure Palm Residences",
      checkIn: "2026-03-29",
      checkOut: "2026-04-02",
    },
    answers: {
      guest_name: "Marco Lim",
      guest_email: "marco@email.com",
      guest_phone: "+63 917 222 1000",
      arrival_time: "2:00 PM",
      guest_count: "4",
      special_occasion: "celebration",
      special_requests: "Birthday setup in the room.",
      accept_terms: true,
    },
    timeline: [
      {
        id: "event_3",
        title: "Webhook recorded",
        description: "Shopify payment captured and confirmation request created.",
        occurredAt: "2026-03-09T04:20:00.000Z",
      },
      {
        id: "event_4",
        title: "Guest submitted confirmation",
        description: "All missing fields were completed.",
        occurredAt: "2026-03-09T05:05:00.000Z",
      },
    ],
  },
];

export function listMockSubmissionSummaries(): SubmissionSummary[] {
  return mockSubmissionsStore.map((submission) => ({
    id: submission.id,
    formTitle: submission.formTitle,
    guestName: submission.guestName,
    guestEmail: submission.guestEmail,
    status: submission.status,
    completionPercent: submission.completionPercent,
    missingCount: submission.missingCount,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    bookingReference: submission.bookingReference,
    shopifyOrderNumber: submission.shopifyOrderNumber,
    confirmationToken: submission.confirmationToken,
    source: submission.source,
  }));
}

export function getMockSubmissionDetail(id: string): SubmissionDetail | undefined {
  return mockSubmissionsStore.find((submission) => submission.id === id);
}
