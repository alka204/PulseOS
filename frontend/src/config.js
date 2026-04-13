/**
 * API base URL.
 * - Dev (default): empty string → same origin + Vite proxy → backend :5000
 * - Production build served separately: set VITE_API_URL=http://localhost:5000 at build time
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** Origin used by Socket.io (same pattern as API) */
export function getSocketOrigin() {
  return API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
}
