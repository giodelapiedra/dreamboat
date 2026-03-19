import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { successResponse } from "../../common/api-response";
import { env } from "../../config/env";
import {
  buildGoogleOAuthStartUrl,
  createGoogleOAuthState,
  exchangeGoogleOAuthCode,
  getGoogleOAuthStatus,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  saveGoogleRefreshToken,
} from "./google-oauth.service";

const GOOGLE_OAUTH_STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 10 * 60 * 1000,
};

export async function getOAuthStatus(_req: Request, res: Response): Promise<void> {
  const status = await getGoogleOAuthStatus();
  res.json(successResponse(status));
}

export async function startOAuth(_req: Request, res: Response): Promise<void> {
  const state = createGoogleOAuthState();
  res.cookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, GOOGLE_OAUTH_STATE_COOKIE_OPTIONS);
  res.redirect(buildGoogleOAuthStartUrl(state));
}

export async function handleOAuthCallback(req: Request, res: Response): Promise<void> {
  const code = String(req.query.code ?? "").trim();
  const state = String(req.query.state ?? "").trim();
  const expectedState = String(req.cookies[GOOGLE_OAUTH_STATE_COOKIE_NAME] ?? "").trim();

  if (!code || !state || !expectedState || state !== expectedState) {
    res.status(StatusCodes.BAD_REQUEST).send("Google OAuth state mismatch. Start the connect flow again.");
    return;
  }

  const refreshToken = await exchangeGoogleOAuthCode(code);
  await saveGoogleRefreshToken(refreshToken);
  res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, GOOGLE_OAUTH_STATE_COOKIE_OPTIONS);

  res.send(`
    <html>
      <body style="font-family: system-ui; padding: 24px; line-height: 1.5;">
        <h1>Google Drive Connected</h1>
        <p>Your Google account is now connected for personal Drive guest-list sync.</p>
        <p>You can close this tab and retry the sync/export flow.</p>
      </body>
    </html>
  `);
}
