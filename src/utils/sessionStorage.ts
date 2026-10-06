// =============================================================================
// BMS Session KPI Dashboard - Cookie & URL Parameter Utilities (T019)
// =============================================================================

/** Cookie name used to persist the BMS session identifier */
export const BMS_SESSION_COOKIE_NAME = 'bms-session-id';

/** Number of days before the session cookie expires */
export const COOKIE_EXPIRY_DAYS = 7;

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

/**
 * Stores the BMS session ID in a cookie with a 7-day expiry.
 *
 * @param sessionId - The session identifier to persist.
 */
export function setSessionCookie(sessionId: string): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

  document.cookie = [
    `${BMS_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    `expires=${expiryDate.toUTCString()}`,
    'path=/',
  ].join('; ');
}

/**
 * Reads the BMS session ID from cookies.
 *
 * @returns The session ID string, or `null` if not found.
 */
export function getSessionCookie(): string | null {
  const cookies = document.cookie.split('; ');

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');
    if (name === BMS_SESSION_COOKIE_NAME) {
      const value = valueParts.join('=');
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

/**
 * Removes the BMS session cookie by setting its expiry to the past.
 */
export function removeSessionCookie(): void {
  document.cookie = [
    `${BMS_SESSION_COOKIE_NAME}=`,
    'expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'path=/',
  ].join('; ');
}

// ---------------------------------------------------------------------------
// URL parameter helpers
// ---------------------------------------------------------------------------

/**
 * Reads the BMS session ID from the current URL's query parameters.
 *
 * @returns The session ID string, or `null` if the parameter is absent.
 */
export function getSessionFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(BMS_SESSION_COOKIE_NAME);
}

/**
 * Removes the `bms-session-id` query parameter from the browser URL without
 * triggering a page reload (uses `history.replaceState`).
 */
export function removeSessionFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(BMS_SESSION_COOKIE_NAME);

  window.history.replaceState(window.history.state, '', url.toString());
}

// ---------------------------------------------------------------------------
// Combined handler
// ---------------------------------------------------------------------------

/**
 * End-to-end handler that:
 * 1. Checks for a session ID in the URL query string.
 * 2. If found, persists it as a cookie and removes it from the URL.
 * 3. Returns the session ID (from URL or existing cookie), or `null`.
 */
export function handleUrlSession(): string | null {
  const urlSessionId = getSessionFromUrl();

  if (urlSessionId) {
    setSessionCookie(urlSessionId);
    removeSessionFromUrl();
    return urlSessionId;
  }

  return getSessionCookie();
}

// ---------------------------------------------------------------------------
// Marketplace token (localStorage)
// ---------------------------------------------------------------------------

/**
 * Passed in the URL when the dashboard is launched from HOSxP. Without it the
 * BMS server masks personal data, so it is kept for the rest of the session.
 */
export const MARKETPLACE_TOKEN_KEY = 'marketplace_token';

export function setMarketplaceToken(token: string): void {
  localStorage.setItem(MARKETPLACE_TOKEN_KEY, token);
}

export function getMarketplaceToken(): string | null {
  return localStorage.getItem(MARKETPLACE_TOKEN_KEY);
}

export function removeMarketplaceToken(): void {
  localStorage.removeItem(MARKETPLACE_TOKEN_KEY);
}

/** True when the URL carries a marketplace token (either spelling launchers use). */
export function hasUrlMarketplaceToken(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('marketplace_token') || params.has('marketplace-token');
}

/**
 * Takes the marketplace token from the URL (`marketplace_token` or
 * `marketplace-token`), stores it and strips it from the address bar.
 * Falls back to the stored token when the URL has none.
 */
export function handleUrlMarketplaceToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('marketplace_token') ?? params.get('marketplace-token');
  if (!urlToken) return getMarketplaceToken();

  setMarketplaceToken(urlToken);
  const url = new URL(window.location.href);
  url.searchParams.delete('marketplace_token');
  url.searchParams.delete('marketplace-token');
  window.history.replaceState(window.history.state, '', url.toString());
  return urlToken;
}
