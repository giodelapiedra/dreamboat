import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { successResponse } from "../../common/api-response";
import { requireRequestUser } from "../../common/request-user";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "../../constants/auth";
import { env } from "../../config/env";
import * as authService from "./auth.service";

function setRefreshCookie(response: Response, refreshToken: string): void {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...REFRESH_TOKEN_COOKIE_OPTIONS,
    secure: env.NODE_ENV === "production",
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  setRefreshCookie(res, result.refreshToken);

  res.status(StatusCodes.CREATED).json(
    successResponse({
      accessToken: result.accessToken,
      user: result.user,
    }),
  );
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshToken);

  res.json(
    successResponse({
      accessToken: result.accessToken,
      user: result.user,
    }),
  );
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME] as
    | string
    | undefined;

  if (!refreshToken) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Authentication required",
      message: "Refresh token cookie is missing",
    });
    return;
  }

  const result = await authService.refreshSession(refreshToken);
  setRefreshCookie(res, result.refreshToken);

  res.json(
    successResponse({
      accessToken: result.accessToken,
      user: result.user,
    }),
  );
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME] as
    | string
    | undefined;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  const { maxAge: _maxAge, ...clearOptions } = REFRESH_TOKEN_COOKIE_OPTIONS;
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    ...clearOptions,
    secure: env.NODE_ENV === "production",
  });
  res.status(StatusCodes.NO_CONTENT).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(requireRequestUser(req).id);
  res.json(successResponse(user));
}

export async function forgotPassword(
  _req: Request,
  res: Response,
): Promise<void> {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Forgot-password flow is reserved for the next phase",
  });
}

export async function resetPassword(
  _req: Request,
  res: Response,
): Promise<void> {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Reset-password flow is reserved for the next phase",
  });
}

