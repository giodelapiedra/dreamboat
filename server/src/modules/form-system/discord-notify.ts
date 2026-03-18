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

  const embed = {
    title: "New Booking Received",
    color: 0x00b894,
    fields: [
      { name: "Guest", value: booking.guestName, inline: true },
      { name: "Email", value: booking.guestEmail, inline: true },
      { name: "Order", value: booking.shopifyOrderNumber, inline: true },
      { name: "Property", value: booking.propertyName, inline: true },
      { name: "Check-in", value: booking.checkIn, inline: true },
      { name: "Check-out", value: booking.checkOut, inline: true },
      { name: "Booking Ref", value: booking.bookingReference, inline: true },
      { name: "Confirmation Link", value: booking.confirmationUrl },
    ],
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Dreamboat",
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, "Discord webhook returned non-OK status");
    }
  } catch (error) {
    logger.error({ error }, "Failed to send Discord notification");
  }
}
