# OAuth 2.0 / OIDC Setup Guide

This guide explains how to configure and use the OAuth 2.0 authentication with Amazon Federate for this application.

## Overview

The application now supports OAuth 2.0 / OpenID Connect (OIDC) authentication using Amazon Federate as the identity provider. Users can sign in using their Amazon credentials through a secure OAuth flow.

## Configuration Steps

### 1. Register Your Application with Amazon Federate

Before using OAuth login, you need to register your application with Amazon Federate to obtain:
- **Client ID**: A unique identifier for your application
- **Client Secret**: A secret key used for authentication (keep this secure!)

Contact your Amazon administrator or visit the Amazon Federate portal to register your application.

### 2. Configure Redirect URIs

When registering your application, you'll need to specify authorized redirect URIs:

**For Development:**
```
http://localhost:3000/oauth/callback
```

**For Production:**
```
https://your-production-domain.com/oauth/callback
```

### 3. Update Environment Variables

Copy `.env.sample` to `.env` and fill in the OAuth configuration:

```bash
# OAuth 2.0 / OIDC Configuration for Amazon Federate
REACT_APP_OIDC_ISSUER=https://idp.federate.amazon.com
REACT_APP_OIDC_CLIENT_ID=your_actual_client_id_here
REACT_APP_OIDC_CLIENT_SECRET=your_actual_client_secret_here
REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/oauth/callback
REACT_APP_OIDC_AUTHORIZATION_ENDPOINT=https://idp.federate.amazon.com/api/oauth2/v1/authorize
REACT_APP_OIDC_TOKEN_ENDPOINT=https://idp.federate.amazon.com/api/oauth2/v2/token
REACT_APP_OIDC_JWKS_URI=https://idp.federate.amazon.com/api/oauth2/v2/certs
```

**Important:** Replace `your_actual_client_id_here` and `your_actual_client_secret_here` with your actual credentials.

### 4. For Production Deployment

Update the `REACT_APP_OIDC_REDIRECT_URI` in your production environment:

```bash
REACT_APP_OIDC_REDIRECT_URI=https://your-production-domain.com/oauth/callback
```

## How OAuth Login Works

### Authentication Flow

1. **User clicks "Sign in with Amazon Federate"** on the login page
2. **Application generates PKCE parameters** (code verifier and code challenge)
3. **User is redirected** to Amazon Federate's authorization page
4. **User authenticates** with their Amazon credentials
5. **Amazon Federate redirects back** to your application with an authorization code
6. **Application exchanges the code** for access tokens
7. **User information is extracted** from the ID token
8. **User is logged in** and redirected to the application

### Security Features

- **PKCE (Proof Key for Code Exchange)**: Protects against authorization code interception
- **State Parameter**: Prevents CSRF attacks
- **Secure Token Storage**: Tokens are stored in browser storage with proper security measures

## File Structure

### New Files Created

1. **`src/common/oauth-utils.js`**
   - OAuth utility functions (PKCE generation, token exchange, JWT decoding)

2. **`src/pages/login/oauth-callback.jsx`**
   - OAuth callback handler component
   - Processes the redirect from Amazon Federate

### Modified Files

1. **`src/pages/login/login.jsx`**
   - Added "Sign in with Amazon Federate" button
   - Integrated OAuth login flow

2. **`src/pages/commons/use-auth.js`**
   - Added `signinWithOAuth()` method for OAuth authentication

3. **`src/App.js`**
   - Added `/oauth/callback` route

4. **`.env.sample`**
   - Added OAuth configuration variables

## Testing OAuth Login

### Local Development

1. Ensure all environment variables are properly configured in `.env`
2. Start the development server:
   ```bash
   yarn start
   ```
3. Navigate to `http://localhost:3000/login`
4. Click "Sign in with Amazon Federate (OAuth 2.0)"
5. You'll be redirected to Amazon Federate's login page
6. After successful authentication, you'll be redirected back to the application

### Troubleshooting

**Problem: "Missing authorization code or state parameter"**
- Solution: Ensure your redirect URI in Amazon Federate matches exactly with your environment variable

**Problem: "Token exchange failed: 401"**
- Solution: Verify your Client ID and Client Secret are correct

**Problem: "Invalid state parameter"**
- Solution: This is a security check - try logging in again from the login page

**Problem: Redirect loop or infinite loading**
- Solution: Check browser console for errors and ensure the callback route is properly registered

## Using OAuth in Development

For development purposes, you can:

1. Use the existing username/password login (legacy method)
2. Use OAuth login with Amazon Federate credentials
3. Use anonymous sign-in for testing

All three methods will work side-by-side.

## Production Considerations

1. **Never commit `.env` file** to version control - it contains secrets
2. **Use environment-specific configuration** for different deployment stages
3. **Rotate client secrets regularly** for security
4. **Monitor token expiration** and implement refresh token logic if needed
5. **Use HTTPS in production** - OAuth requires secure connections

## API Token Usage

After OAuth login, the application receives an access token which is used for API authentication:

```javascript
// In API calls
headers: {
  'Authorization': `Bearer ${access_token}`
}
```

The token is automatically included in all authenticated API requests through the existing `useAuthorizedHeader()` hook.

## Additional Resources

- Amazon Federate OIDC Configuration: https://idp.federate.amazon.com/.well-known/openid-configuration
- OAuth 2.0 Specification: https://oauth.net/2/
- PKCE RFC: https://tools.ietf.org/html/rfc7636
