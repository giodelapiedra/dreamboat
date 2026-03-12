import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { successResponse } from "../../common/api-response";
import { requireRequestUser } from "../../common/request-user";
import * as bookingsService from "./bookings.service";

export async function getMine(req: Request, res: Response): Promise<void> {
  const bookings = await bookingsService.getMine(requireRequestUser(req).id);
  res.json(successResponse(bookings));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const booking = await bookingsService.getById(
    String(req.params.id),
    requireRequestUser(req).id,
  );
  res.json(successResponse(booking));
}

export async function create(req: Request, res: Response): Promise<void> {
  const booking = await bookingsService.create(requireRequestUser(req).id, req.body);
  res.status(StatusCodes.CREATED).json(successResponse(booking));
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const booking = await bookingsService.cancel(
    String(req.params.id),
    requireRequestUser(req).id,
  );
  res.json(successResponse(booking));
}
