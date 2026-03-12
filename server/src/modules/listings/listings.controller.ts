import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { successResponse } from "../../common/api-response";
import { requireRequestUser } from "../../common/request-user";
import * as listingsService from "./listings.service";

export async function getAll(req: Request, res: Response): Promise<void> {
  const result = await listingsService.getAll(
    req.query as unknown as listingsService.ListingQuery,
    req.user,
  );
  res.json(successResponse(result.data, result.meta));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const listing = await listingsService.getById(String(req.params.id), req.user);
  res.json(successResponse(listing));
}

export async function create(req: Request, res: Response): Promise<void> {
  const listing = await listingsService.create(requireRequestUser(req), req.body);
  res.status(StatusCodes.CREATED).json(successResponse(listing));
}

export async function update(req: Request, res: Response): Promise<void> {
  const listing = await listingsService.update(
    String(req.params.id),
    requireRequestUser(req),
    req.body,
  );
  res.json(successResponse(listing));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await listingsService.remove(String(req.params.id), requireRequestUser(req));
  res.status(StatusCodes.NO_CONTENT).send();
}

export async function getAvailability(req: Request, res: Response): Promise<void> {
  const bookings = await listingsService.getAvailability(String(req.params.id));
  res.json(successResponse(bookings));
}
