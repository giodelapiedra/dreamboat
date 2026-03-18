const API_URL = import.meta.env.VITE_API_URL;
const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Big Dream Boatman";
const ENABLE_FORM_FALLBACK = import.meta.env.VITE_ENABLE_FORM_FALLBACK !== "false";

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export const env = {
  API_URL,
  APP_NAME,
  ENABLE_FORM_FALLBACK,
} as const;
