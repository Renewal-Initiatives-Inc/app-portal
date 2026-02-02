/**
 * Zitadel Management API Client
 * Handles authentication via JWT bearer token (service account)
 */

import { SignJWT, importPKCS8 } from 'jose';
import { createPrivateKey } from 'crypto';
import type { ZitadelError } from './types';

// Environment variables for Zitadel Management API
const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!;
const ZITADEL_SERVICE_ACCOUNT_USER_ID = process.env.ZITADEL_SERVICE_ACCOUNT_USER_ID;
const ZITADEL_SERVICE_ACCOUNT_KEY_ID = process.env.ZITADEL_SERVICE_ACCOUNT_KEY_ID;
const ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY = process.env.ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY;
const ZITADEL_PROJECT_ID = process.env.ZITADEL_PROJECT_ID;
const ZITADEL_ORG_ID = process.env.ZITADEL_ORG_ID;

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Check if the Zitadel Management API is configured
 */
export function isZitadelManagementConfigured(): boolean {
  return !!(
    ZITADEL_ISSUER &&
    ZITADEL_SERVICE_ACCOUNT_USER_ID &&
    ZITADEL_SERVICE_ACCOUNT_KEY_ID &&
    ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY &&
    ZITADEL_PROJECT_ID &&
    ZITADEL_ORG_ID
  );
}

/**
 * Get the Zitadel project ID
 */
export function getProjectId(): string {
  if (!ZITADEL_PROJECT_ID) {
    throw new Error('ZITADEL_PROJECT_ID is not configured');
  }
  return ZITADEL_PROJECT_ID;
}

/**
 * Get the Zitadel organization ID
 */
export function getOrgId(): string {
  if (!ZITADEL_ORG_ID) {
    throw new Error('ZITADEL_ORG_ID is not configured');
  }
  return ZITADEL_ORG_ID;
}

/**
 * Generate a JWT assertion for the service account
 */
async function generateJwtAssertion(): Promise<string> {
  if (!ZITADEL_SERVICE_ACCOUNT_USER_ID || !ZITADEL_SERVICE_ACCOUNT_KEY_ID || !ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Zitadel service account credentials are not configured');
  }

  // Decode the base64-encoded private key
  let privateKeyPem: string;
  try {
    privateKeyPem = Buffer.from(ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY, 'base64').toString('utf-8');
  } catch {
    // If not base64, try using it directly
    privateKeyPem = ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY;
  }

  // Convert PKCS#1 (RSA PRIVATE KEY) to PKCS#8 (PRIVATE KEY) format if needed
  // Zitadel provides keys in PKCS#1 format, but jose expects PKCS#8
  let pkcs8Pem: string;
  if (privateKeyPem.includes('BEGIN RSA PRIVATE KEY')) {
    const keyObject = createPrivateKey(privateKeyPem);
    pkcs8Pem = keyObject.export({ type: 'pkcs8', format: 'pem' }) as string;
  } else {
    pkcs8Pem = privateKeyPem;
  }

  // Import the private key
  const privateKey = await importPKCS8(pkcs8Pem, 'RS256');

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  // Create the JWT assertion
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: ZITADEL_SERVICE_ACCOUNT_KEY_ID })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .setIssuer(ZITADEL_SERVICE_ACCOUNT_USER_ID)
    .setSubject(ZITADEL_SERVICE_ACCOUNT_USER_ID)
    .setAudience(ZITADEL_ISSUER)
    .sign(privateKey);

  return jwt;
}

/**
 * Exchange JWT assertion for an access token
 */
async function getAccessToken(): Promise<string> {
  // Check cache first
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const jwtAssertion = await generateJwtAssertion();
  const tokenUrl = `${ZITADEL_ISSUER}/oauth/v2/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion,
      scope: 'openid urn:zitadel:iam:org:project:id:zitadel:aud',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return data.access_token;
}

/**
 * Clear the cached token (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}

/**
 * Make an authenticated request to the Zitadel Management API
 */
export async function zitadelRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!isZitadelManagementConfigured()) {
    throw new Error('Zitadel Management API is not configured. Please set the required environment variables.');
  }

  const token = await getAccessToken();
  const url = `${ZITADEL_ISSUER}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add organization header if available
  if (ZITADEL_ORG_ID) {
    headers['x-zitadel-orgid'] = ZITADEL_ORG_ID;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ZitadelError | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    const errorMessage = errorData?.message || `HTTP ${response.status}`;
    console.error('Zitadel API error:', {
      status: response.status,
      path,
      error: errorData,
    });

    // Handle token expiry
    if (response.status === 401) {
      clearTokenCache();
      // Could retry here, but for now just throw
    }

    throw new Error(`Zitadel API error: ${errorMessage}`);
  }

  // Handle empty responses (like DELETE operations)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

/**
 * Export for testing
 */
export const _internal = {
  generateJwtAssertion,
  getAccessToken,
};
