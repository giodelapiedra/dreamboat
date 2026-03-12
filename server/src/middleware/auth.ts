import type { NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

import type { Role } from "@dreamboat/shared";
import { verifyAccessToken } from "../lib/jwt";

export const authenticate: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Authentication required",
      message: "Missing bearer token",
    });
    return;
  }

  const token = authorizationHeader.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Authentication required",
      message: "Invalid access token",
    });
  }
};

export function authorize(...roles: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Authentication required",
        message: "User context is missing",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}


