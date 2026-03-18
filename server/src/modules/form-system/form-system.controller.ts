import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { successResponse } from "../../common/api-response";
import * as formSystemService from "./form-system.service";
import { exportSubmissionsToExcel } from "./export.service";
import { parseShopifyOrder, type ShopifyOrderPayload } from "./shopify-parser";

export async function getConfirmationPayload(req: Request, res: Response): Promise<void> {
  const payload = await formSystemService.getConfirmationPayload(String(req.params.token));
  res.json(successResponse(payload));
}

export async function submitConfirmation(req: Request, res: Response): Promise<void> {
  const submission = await formSystemService.submitConfirmation(String(req.params.token), req.body);
  res.json(successResponse(submission));
}

export async function getSubmissionSummaries(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as {
    page: number;
    pageSize: number;
    statusGroup?: "active" | "completed";
    status?: Parameters<typeof formSystemService.getSubmissionSummaries>[0]["status"];
    search?: string;
    sort: string;
    dir: "asc" | "desc";
  };
  const result = await formSystemService.getSubmissionSummaries(query);
  res.json(successResponse(result.data, result.meta));
}

export async function getSubmissionCounts(req: Request, res: Response): Promise<void> {
  const statusGroup = req.query.statusGroup as "active" | "completed" | undefined;
  const counts = await formSystemService.getSubmissionCounts(statusGroup);
  res.json(successResponse(counts));
}

export async function getSubmissionDetail(req: Request, res: Response): Promise<void> {
  const submission = await formSystemService.getSubmissionDetail(String(req.params.id));
  res.json(successResponse(submission));
}

export async function handleShopifyWebhook(req: Request, res: Response): Promise<void> {
  const result = await formSystemService.handleShopifyWebhook(req.body);
  res.status(StatusCodes.CREATED).json(successResponse(result));
}

/**
 * Receives the actual raw Shopify orders/paid webhook payload,
 * parses product titles + variants to extract booking info,
 * and creates submissions for each line item.
 *
 * If product titles don't match the expected format, falls back
 * to generic data so every order still creates a submission.
 */
export async function handleShopifyRawWebhook(req: Request, res: Response): Promise<void> {
  const payload = req.body as ShopifyOrderPayload;
  const orderNumber = payload.name
    ?? (payload.order_number ? `#${payload.order_number}` : `#${payload.id ?? "unknown"}`);
  const guestEmail = payload.email ?? payload.customer?.email;
  const guestName = payload.customer
    ? [payload.customer.first_name, payload.customer.last_name].filter(Boolean).join(" ") || undefined
    : undefined;
  const today = new Date().toISOString().slice(0, 10);

  const bookings = parseShopifyOrder(payload);
  const lineItems = payload.line_items ?? [];
  const results = [];

  // Build a set of parsed line item indices so we know which ones were handled
  const parsedTitles = new Set(bookings.map((b) => b.propertyName));

  // Process structured bookings (successfully parsed line items)
  for (const booking of bookings) {
    const input: Parameters<typeof formSystemService.handleShopifyWebhook>[0] = {
      formSlug: "guest-confirmation",
      shopifyOrderNumber: booking.shopifyOrderNumber,
      propertyName: booking.propertyName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
    };
    if (booking.guestName) input.guestName = booking.guestName;
    if (booking.guestEmail) input.guestEmail = booking.guestEmail;

    const result = await formSystemService.handleShopifyWebhook(input);
    results.push(result);
  }

  // Fallback: create submissions for line items that failed to parse
  for (const item of lineItems) {
    const title = item.title ?? "Shopify Order";
    // Skip items that were already handled by the parser
    const routeName = title.replace(/^\d+D\/\d+N\s*/i, "").split(/\s*-\s*/)[0]?.trim();
    if (routeName && parsedTitles.has(routeName)) continue;

    const input: Parameters<typeof formSystemService.handleShopifyWebhook>[0] = {
      formSlug: "guest-confirmation",
      shopifyOrderNumber: orderNumber,
      propertyName: title,
      checkIn: today,
      checkOut: today,
    };
    if (guestName) input.guestName = guestName;
    if (guestEmail) input.guestEmail = guestEmail;

    const result = await formSystemService.handleShopifyWebhook(input);
    results.push(result);
  }

  // If no line items at all, still create one submission
  if (results.length === 0) {
    const input: Parameters<typeof formSystemService.handleShopifyWebhook>[0] = {
      formSlug: "guest-confirmation",
      shopifyOrderNumber: orderNumber,
      propertyName: "Shopify Order",
      checkIn: today,
      checkOut: today,
    };
    if (guestName) input.guestName = guestName;
    if (guestEmail) input.guestEmail = guestEmail;

    const result = await formSystemService.handleShopifyWebhook(input);
    results.push(result);
  }

  res.status(StatusCodes.CREATED).json(successResponse(results));
}

export async function getTrips(_req: Request, res: Response): Promise<void> {
  const trips = await formSystemService.getTrips();
  res.json(successResponse(trips));
}

export async function exportSubmissions(req: Request, res: Response): Promise<void> {
  const filters = {
    propertyName: req.query.propertyName as string | undefined,
    checkIn: req.query.checkIn as string | undefined,
    checkOut: req.query.checkOut as string | undefined,
  };

  const buffer = await exportSubmissionsToExcel(filters);
  const filename = `guest-list-${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
}
