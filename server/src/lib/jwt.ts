import jwt, { type SignOptions, type Secret } from "jsonwebtoken";

import { env } from "../config/env";
import { HttpError } from "./http-error";

export interface AccessTokenPayload {
  sub: string;
  role: "GUEST" | "HOST" | "ADMIN";
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

const accessTokenExpiresIn = env.JWT_ACCESS_EXPIRES_IN as NonNullable<
  SignOptions["expiresIn"]
>;
const refreshTokenExpiresIn = env.JWT_REFRESH_EXPIRES_IN as NonNullable<
  SignOptions["expiresIn"]
>;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as Secret, {
    expiresIn: accessTokenExpiresIn,
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as Secret, {
    expiresIn: refreshTokenExpiresIn,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new HttpError(401, "Invalid refresh token");
  }
}
