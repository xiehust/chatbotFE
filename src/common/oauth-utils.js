// OAuth 2.0 / OIDC utility functions for Amazon Federate

/**
 * Generate a random string for PKCE code verifier
 */
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Generate SHA256 hash and base64url encode for PKCE
 */
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return hash;
}

function base64urlencode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach(byte => {
    str += String.fromCharCode(byte);
  });
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate PKCE code challenge from code verifier
 */
async function generateCodeChallenge(codeVerifier) {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
}

/**
 * Generate a random state parameter
 */
function generateState() {
  return generateRandomString(32);
}

/**
 * Get OAuth configuration from environment variables
 */
export function getOAuthConfig() {
  return {
    issuer: process.env.REACT_APP_OIDC_ISSUER,
    clientId: process.env.REACT_APP_OIDC_CLIENT_ID,
    clientSecret: process.env.REACT_APP_OIDC_CLIENT_SECRET,
    redirectUri: process.env.REACT_APP_OIDC_REDIRECT_URI || `${window.location.origin}/oauth/callback`,
    authorizationEndpoint: process.env.REACT_APP_OIDC_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: process.env.REACT_APP_OIDC_TOKEN_ENDPOINT,
    jwksUri: process.env.REACT_APP_OIDC_JWKS_URI,
    userinfoEndpoint: process.env.REACT_APP_OIDC_USERINFO_ENDPOINT,
  };
}

/**
 * Initiate OAuth 2.0 authorization code flow with PKCE
 */
export async function initiateOAuthLogin() {
  const config = getOAuthConfig();

  // Generate PKCE parameters
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store code verifier and state in session storage
  sessionStorage.setItem('oauth_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'openid email profile',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${config.authorizationEndpoint}?${params.toString()}`;

  // Redirect to authorization endpoint
  window.location.href = authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code, state) {
  const config = getOAuthConfig();

  // Verify state parameter
  const storedState = sessionStorage.getItem('oauth_state');
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }

  // Get code verifier from session storage
  const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  // Prepare token request
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  });

  // If client secret is available, use client_secret_post authentication
  if (config.clientSecret) {
    params.append('client_secret', config.clientSecret);
  }

  try {
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
    }

    const tokens = await response.json();

    // Clean up session storage
    sessionStorage.removeItem('oauth_code_verifier');
    sessionStorage.removeItem('oauth_state');

    return tokens;
  } catch (error) {
    // Clean up session storage on error
    sessionStorage.removeItem('oauth_code_verifier');
    sessionStorage.removeItem('oauth_state');
    throw error;
  }
}

/**
 * Decode JWT token (without verification - use for display only)
 */
export function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract user information from ID token
 */
export function extractUserInfo(idToken) {
  const decoded = decodeJWT(idToken);
  if (!decoded) {
    return null;
  }

  // Extract groups from cognito:groups or custom groups claim
  const cognitoGroups = decoded['cognito:groups'] || decoded.groups || [];

  // Extract username from various possible claims
  let username = decoded['cognito:username'] ||
                 decoded.preferred_username ||
                 decoded.email ||
                 decoded.sub;

  // Remove 'midway_' prefix if present
  if (username && username.startsWith('midway_')) {
    username = username.substring(7); // Remove 'midway_' (7 characters)
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    username: username,
    groups: cognitoGroups,
    groupname: cognitoGroups.length > 0 ? cognitoGroups[0] : 'user',
    company: decoded.company || decoded['custom:company'] || 'default',
    isAuthorized: true,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  const config = getOAuthConfig();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Prepare token refresh request
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  // Add client secret if available
  if (config.clientSecret) {
    params.append('client_secret', config.clientSecret);
  }

  try {
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
    }

    const tokens = await response.json();

    // Return new tokens
    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token || refreshToken, // Keep old refresh token if new one not provided
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

/**
 * Check if token is expired or about to expire
 * Returns true if token will expire within the next 5 minutes
 */
export function isTokenExpired(token, bufferSeconds = 300) {
  if (!token) return true;

  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;

    // Return true if expired or will expire within buffer time
    return expirationTime <= (currentTime + bufferSeconds);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpirationTime(token) {
  if (!token) return null;

  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;

    return Math.max(0, expirationTime - currentTime);
  } catch (error) {
    console.error('Error getting token expiration time:', error);
    return null;
  }
}

/**
 * Logout and clear tokens
 */
export function logout() {
  // Clear session storage
  sessionStorage.removeItem('oauth_code_verifier');
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_access_token');
  sessionStorage.removeItem('oauth_id_token');
  sessionStorage.removeItem('oauth_refresh_token');

  // Clear local storage
  const localStoreKey = 'chatbot-tokendata'; // Import from shared.js if needed
  localStorage.removeItem(localStoreKey);
}
