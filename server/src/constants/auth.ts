export const REFRESH_TOKEN_COOKIE_NAME = "dreamboat_refresh_token";

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
