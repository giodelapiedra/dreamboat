import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    error: "Not found",
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
}

