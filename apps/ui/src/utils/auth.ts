/**
 * Generate a consistent hash from username/email to use as userId
 */
export async function hashUserId(identifier: string): Promise<string> {
  // Normalize the identifier (lowercase, trim)
  const normalized = identifier.toLowerCase().trim();
  
  // Use Web Crypto API to create SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return first 32 characters (64 hex chars = 32 bytes, which is enough)
  return hashHex.substring(0, 32);
}

/**
 * Cookie utilities for authentication persistence
 */
const AUTH_COOKIE_NAME = 'flash_sale_auth';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export function setAuthCookie(identifier: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_MAX_AGE * 1000);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(identifier)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function getAuthCookie(): string | null {
  const name = AUTH_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}

export function removeAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
