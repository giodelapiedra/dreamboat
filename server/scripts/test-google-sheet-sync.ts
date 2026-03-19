import { prisma } from "../src/lib/prisma";
import { syncTripGuestListToGoogleSheetOrThrow } from "../src/modules/form-system/google-sheets.service";

async function main(): Promise<void> {
  const latestTrip = await prisma.$queryRaw<
    Array<{
      propertyName: string;
      checkIn: string;
      checkOut: string;
    }>
  >`
    SELECT
      "propertyName",
      "checkIn",
      "checkOut"
    FROM "Submission"
    GROUP BY "propertyName", "checkIn", "checkOut"
    ORDER BY MAX("createdAt") DESC
    LIMIT 1
  `;

  const trip = latestTrip[0];
  if (!trip) {
    throw new Error("No submissions found to sync");
  }

  const result = await syncTripGuestListToGoogleSheetOrThrow({
    propertyName: trip.propertyName,
    checkIn: trip.checkIn,
    checkOut: trip.checkOut,
  });

  if (!result) {
    throw new Error("Google sync is not configured. Check GOOGLE_DRIVE_FOLDER_ID / service account env vars.");
  }

  console.log(`SYNC_OK ${trip.propertyName} ${trip.checkIn} ${trip.checkOut}`);
  console.log(`FILE_ID ${result.spreadsheetId}`);
  console.log(`FILE_NAME ${result.spreadsheetName}`);
  if (result.spreadsheetUrl) {
    console.log(`FILE_URL ${result.spreadsheetUrl}`);
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
