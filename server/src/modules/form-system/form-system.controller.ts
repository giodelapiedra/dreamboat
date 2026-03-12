import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { successResponse } from "../../common/api-response";
import * as formSystemService from "./form-system.service";

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
