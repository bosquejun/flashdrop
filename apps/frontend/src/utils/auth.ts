/**
 * Generate a consistent hash from username/email to use as userId
 */
export async function hashUserId(identifier: string): Promise<string> {
  // Normalize the identifier (lowercase, trim)
  const normalized = identifier.toLowerCase().trim();

  // Use Web Crypto API to create SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Return first 32 characters (64 hex chars = 32 bytes, which is enough)
  return hashHex.substring(0, 32);
}

/**
 * Cookie for frontend-only auth: stores identifier (username/email) for display name.
 * API uses its own cookie "flashdrop-user-id" (hashed userId) set by POST /api/v1/auth/login.
 */
const AUTH_COOKIE_NAME = "flashdrop-auth-identifier";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export function setAuthCookie(identifier: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_MAX_AGE * 1000);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(identifier)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export async function getAuthCookie(): Promise<string | null> {
  // if (typeof document === "undefined" || !document.cookie) return null;
  const cookie = await window.cookieStore.get(AUTH_COOKIE_NAME);
  return cookie?.value ?? null;
}

export function removeAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
