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

export async function getSubmissionSummaries(_req: Request, res: Response): Promise<void> {
  const submissions = await formSystemService.getSubmissionSummaries();
  res.json(successResponse(submissions));
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
 */
export async function handleShopifyRawWebhook(req: Request, res: Response): Promise<void> {
  const payload = req.body as ShopifyOrderPayload;
  const bookings = parseShopifyOrder(payload);

  if (bookings.length === 0) {
    res.status(StatusCodes.OK).json(successResponse({
      message: "No bookable line items found in this order",
      parsed: 0,
    }));
    return;
  }

  const results = [];
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
