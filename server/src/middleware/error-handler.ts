import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

import type { ErrorResponse } from "../common/api-response";
import { logger } from "../config/logger";
import { HttpError } from "../lib/http-error";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: "Request failed",
      message: error.message,
      issues: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: "Validation failed",
      message: "One or more request fields are invalid",
      issues: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: "Database error",
      message: error.message,
    });
    return;
  }

  logger.error({ err: error }, "Unhandled error");
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: "Internal server error",
    message: "Something went wrong",
  });
}


