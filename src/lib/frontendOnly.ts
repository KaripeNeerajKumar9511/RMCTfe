/**
 * When true, dashboard uses only in-memory / demo data and does not call the backend API.
 * All dashboard/* pages work without a running backend (no 500s, no network calls).
 *
 * To use the backend when it's ready: set NEXT_PUBLIC_USE_FRONTEND_ONLY=false in .env.local
 */
export const USE_FRONTEND_ONLY =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_USE_FRONTEND_ONLY !== 'false';
