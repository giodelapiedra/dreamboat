import type { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../lib/http-error";

export function requireRequestUser(req: Request): Express.User {
  if (!req.user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  return req.user;
}

