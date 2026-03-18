import { env } from "../../config/env";
import { logger } from "../../config/logger";

interface BookingNotification {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  shopifyOrderNumber: string;
  bookingReference: string;
  confirmationUrl: string;
}

export async function notifyDiscordNewBooking(booking: BookingNotification): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) return;

  const message = [
    `**🛳️ New Booking Received**`,
    ``,
    `**Guest:** ${booking.guestName}`,
    `**Email:** ${booking.guestEmail}`,
    `**Order:** ${booking.shopifyOrderNumber}`,
    `**Property:** ${booking.propertyName}`,
    `**Check-in:** ${booking.checkIn}`,
    `**Check-out:** ${booking.checkOut}`,
    `**Booking Ref:** ${booking.bookingReference}`,
    `**Confirmation:** ${booking.confirmationUrl}`,
  ].join("\n");

  try {
    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Big Dream Boatman",
        content: message,
      }),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, "Discord webhook returned non-OK status");
    }
  } catch (error) {
    logger.error({ error }, "Failed to send Discord notification");
  }
}
