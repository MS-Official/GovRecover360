const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'mock').toLowerCase();
// Existing source fallback. Client IDs are public-safe in SPA OIDC PKCE flows; do not put a client secret here.
const SOURCE_CLIENT_ID_FALLBACK = 'your_asgardeo_client_id';
const CLIENT_ID = import.meta.env.VITE_ASGARDEO_CLIENT_ID || SOURCE_CLIENT_ID_FALLBACK;
const BASE_URL = (import.meta.env.VITE_ASGARDEO_BASE_URL || 'https://api.asgardeo.io/t/geoedge').replace(/\/$/, '');
const AUTH_URL = (import.meta.env.VITE_ASGARDEO_AUTH_URL || 'https://accounts.asgardeo.io/t/geoedge').replace(/\/$/, '');
const REDIRECT_URL =
  import.meta.env.VITE_ASGARDEO_REDIRECT_URI ||
  `${window.location.origin}/callback`;
const LOGOUT_REDIRECT_URL =
  import.meta.env.VITE_ASGARDEO_LOGOUT_REDIRECT_URI ||
  `${window.location.origin}/login`;
const SCOPES = import.meta.env.VITE_ASGARDEO_SCOPES || 'openid profile email groups';
const SIGN_UP_URL =
  import.meta.env.VITE_ASGARDEO_SIGN_UP_URL ||
  'https://accounts.asgardeo.io/t/geoedge/accountrecoveryendpoint/register.do';

const encoder = new TextEncoder();

function base64UrlEncode(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomString() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

async function sha256(value: string) {
  return crypto.subtle.digest('SHA-256', encoder.encode(value));
}

export function isAsgardeoConfigured() {
  return ['asgardeo', 'hybrid'].includes(AUTH_MODE) && Boolean(CLIENT_ID && BASE_URL && AUTH_URL && REDIRECT_URL);
}

export function getAuthMode() {
  return AUTH_MODE;
}

export function getSignUpUrl() {
  return SIGN_UP_URL;
}

export async function startAsgardeoLogin() {
  if (!isAsgardeoConfigured()) {
    throw new Error('Asgardeo is not configured.');
  }
  const verifier = randomString();
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = randomString();
  sessionStorage.setItem('oidc_code_verifier', verifier);
  sessionStorage.setItem('oidc_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URL,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  // OLD IMPLEMENTATION - kept for reference
  // Reason: replaced with VITE_ASGARDEO_AUTH_URL so authorize can use accounts.asgardeo.io.
  // window.location.href = `${BASE_URL}/oauth2/authorize?${params.toString()}`;
  window.location.href = `${AUTH_URL}/oauth2/authorize?${params.toString()}`;
}

export function startAsgardeoRegistration() {
  if (SIGN_UP_URL) {
    window.location.href = SIGN_UP_URL;
    return true;
  }
  return false;
}

export async function exchangeCodeForToken(code: string, state: string | null) {
  const expectedState = sessionStorage.getItem('oidc_state');
  const verifier = sessionStorage.getItem('oidc_code_verifier');
  if (!expectedState || expectedState !== state || !verifier) {
    throw new Error('Invalid login callback state.');
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URL,
    code_verifier: verifier,
  });
  const response = await fetch(`${BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error('Token exchange failed.');
  }
  sessionStorage.removeItem('oidc_state');
  sessionStorage.removeItem('oidc_code_verifier');
  return response.json() as Promise<{ access_token: string; id_token?: string; token_type: string }>;
}

export function getAsgardeoLogoutUrl(idToken?: string | null) {
  if (!AUTH_URL) return '/login';
  const params = new URLSearchParams({ post_logout_redirect_uri: LOGOUT_REDIRECT_URL });
  if (idToken) params.set('id_token_hint', idToken);
  // OLD IMPLEMENTATION - kept for reference
  // Reason: replaced with VITE_ASGARDEO_AUTH_URL for browser auth endpoints.
  // return `${BASE_URL}/oidc/logout?${params.toString()}`;
  return `${AUTH_URL}/oidc/logout?${params.toString()}`;
}
