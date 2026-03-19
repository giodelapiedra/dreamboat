import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { StatusCodes } from "http-status-codes";

import { env } from "../../config/env";
import { HttpError } from "../../lib/http-error";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_SCOPE = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");
const GOOGLE_OAUTH_TOKEN_FILE = path.join(process.cwd(), ".google-oauth.json");
export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "google_oauth_state";

interface GoogleOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
}

interface StoredGoogleOAuthToken {
  refreshToken: string;
  updatedAt: string;
}

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function getOAuthConfig(): GoogleOAuthConfig {
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new HttpError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Google OAuth client credentials are not configured.",
    );
  }

  return {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI ?? "http://localhost:3000/api/google/oauth/callback",
  };
}

async function requestGoogleToken(body: URLSearchParams): Promise<GoogleOAuthTokenResponse> {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new HttpError(
      StatusCodes.BAD_GATEWAY,
      `Google OAuth token exchange failed: ${detail}`,
    );
  }

  return await response.json() as GoogleOAuthTokenResponse;
}

export function createGoogleOAuthState(): string {
  return crypto.randomUUID();
}

export function buildGoogleOAuthStartUrl(state: string): string {
  const config = getOAuthConfig();
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_OAUTH_SCOPE,
    state,
  });

  return `${GOOGLE_OAUTH_AUTH_URL}?${query}`;
}

export async function exchangeGoogleOAuthCode(code: string): Promise<string> {
  const config = getOAuthConfig();
  const token = await requestGoogleToken(new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  }));

  if (!token.refresh_token) {
    throw new HttpError(
      StatusCodes.BAD_GATEWAY,
      "Google OAuth callback did not return a refresh token. Try reconnecting and approving consent again.",
    );
  }

  return token.refresh_token;
}

export async function saveGoogleRefreshToken(refreshToken: string): Promise<void> {
  const tokenPayload: StoredGoogleOAuthToken = {
    refreshToken,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(GOOGLE_OAUTH_TOKEN_FILE, JSON.stringify(tokenPayload, null, 2), "utf8");
}

async function loadRefreshTokenFromFile(): Promise<string | null> {
  try {
    const file = await fs.readFile(GOOGLE_OAUTH_TOKEN_FILE, "utf8");
    const parsed = JSON.parse(file) as Partial<StoredGoogleOAuthToken>;
    return typeof parsed.refreshToken === "string" && parsed.refreshToken.length > 0
      ? parsed.refreshToken
      : null;
  } catch {
    return null;
  }
}

export async function getStoredGoogleRefreshToken(): Promise<string | null> {
  if (env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim()) {
    return env.GOOGLE_OAUTH_REFRESH_TOKEN.trim();
  }

  return await loadRefreshTokenFromFile();
}

export async function getGoogleDriveAccessTokenOrThrow(): Promise<string> {
  const refreshToken = await getStoredGoogleRefreshToken();
  if (!refreshToken) {
    throw new HttpError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "Google Drive is not connected yet. Complete the /api/google/oauth/start flow first.",
    );
  }

  const config = getOAuthConfig();
  const token = await requestGoogleToken(new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }));

  return token.access_token;
}

export async function getGoogleOAuthStatus(): Promise<{ connected: boolean; redirectUri: string }> {
  const config = getOAuthConfig();
  const refreshToken = await getStoredGoogleRefreshToken();
  return {
    connected: Boolean(refreshToken),
    redirectUri: config.redirectUri,
  };
}
