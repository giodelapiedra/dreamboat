import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Find the guest-confirmation form
  const form = await prisma.form.findFirst({
    where: { slug: "guest-confirmation", isActive: true },
  });

  if (!form) {
    console.error("Form not found. Run seed first: npx tsx server/prisma/seed.ts");
    return;
  }

  const token = crypto.randomUUID();

  const submission = await prisma.submission.create({
    data: {
      formId: form.id,
      guestName: "Peggy Lu",
      guestEmail: "peggylu95@gmail.com",
      status: "PENDING",
      completionPercent: 0,
      missingCount: 10,
      bookingReference: "DB-150488",
      shopifyOrderNumber: "#15488",
      propertyName: "BLUE BISON - Coron to El Nido",
      checkIn: "2026-03-12",
      checkOut: "2026-03-15",
      answers: {
        guest_name: "Peggy Lu",
        guest_email: "peggylu95@gmail.com",
      },
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
  });

  console.log("\n=== Sample Booking Created ===");
  console.log(`Guest: Peggy Lu (peggylu95@gmail.com)`);
  console.log(`Order: #15488`);
  console.log(`Property: BLUE BISON - Coron to El Nido`);
  console.log(`Dates: March 12-15, 2026`);
  console.log(`\nConfirmation Link:`);
  console.log(`http://localhost:5173/confirm/${token}`);
  console.log(`\nSubmission ID: ${submission.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
