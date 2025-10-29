# AWS Cognito OAuth 2.0 Setup Guide

## Overview

This application uses OAuth 2.0 / OpenID Connect (OIDC) authentication with **AWS Cognito** as the identity provider.

## AWS Cognito Configuration

### Current Configuration

- **User Pool ID**: `us-east-1_Sq3IYsy06`
- **Region**: `us-east-1`
- **Cognito Domain**: `us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com`

### OIDC Endpoints

The following endpoints are automatically configured from the Cognito OIDC discovery document:

- **Issuer**: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06`
- **Authorization Endpoint**: `https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/authorize`
- **Token Endpoint**: `https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/token`
- **JWKS URI**: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06/.well-known/jwks.json`
- **UserInfo Endpoint**: `https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/userInfo`

## Configuration Steps

### 1. Environment Variables

The `.env` file is already configured with the correct Cognito settings:

```bash
REACT_APP_OIDC_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06
REACT_APP_OIDC_CLIENT_ID=682bjuqrjenmreflci9h5189s4
REACT_APP_OIDC_CLIENT_SECRET=1079kpils6bmvbkgeotreq7mcbiceq8kmgh2fhs904t8229fbhar
REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/oauth/callback
REACT_APP_OIDC_AUTHORIZATION_ENDPOINT=https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/authorize
REACT_APP_OIDC_TOKEN_ENDPOINT=https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/token
REACT_APP_OIDC_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06/.well-known/jwks.json
REACT_APP_OIDC_USERINFO_ENDPOINT=https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/userInfo
```

### 2. Cognito App Client Configuration

In your Cognito User Pool, ensure the App Client is configured with:

#### Allowed OAuth Flows
- ✅ Authorization code grant
- ✅ Implicit grant (optional)

#### Allowed OAuth Scopes
- ✅ openid
- ✅ email
- ✅ profile
- ✅ phone (optional)

#### Callback URLs
**Development:**
```
http://localhost:3000/oauth/callback
```

**Production:**
```
https://your-production-domain.com/oauth/callback
```

#### Sign-out URLs
```
http://localhost:3000/login
https://your-production-domain.com/login
```

### 3. Advanced Security Features (Recommended)

Enable these features in your Cognito User Pool App Client:

- ✅ **PKCE (Proof Key for Code Exchange)** - Already implemented in the code
- ✅ **Refresh Token Rotation** - Recommended for security
- ✅ **Token Revocation** - Allows revoking tokens

## Authentication Flow

### 1. User Clicks "Sign in with AWS Cognito"
The application initiates the OAuth flow with PKCE:

```javascript
initiateOAuthLogin()
```

### 2. Authorization Request
User is redirected to Cognito's hosted UI with parameters:
- `response_type=code`
- `client_id={your_client_id}`
- `redirect_uri=http://localhost:3000/oauth/callback`
- `scope=openid email profile`
- `code_challenge={calculated_challenge}`
- `code_challenge_method=S256`
- `state={random_state}`

### 3. User Authenticates
User logs in with Cognito credentials (or federated identity providers if configured)

### 4. Authorization Code Redirect
Cognito redirects back to your callback URL with:
- `code={authorization_code}`
- `state={original_state}`

### 5. Token Exchange
Application exchanges the authorization code for tokens:

```javascript
exchangeCodeForTokens(code, state)
```

Returns:
- `access_token` - For API authorization
- `id_token` - Contains user information
- `refresh_token` - For refreshing the session

### 6. User Information Extraction
Application extracts user details from the ID token:

```javascript
extractUserInfo(id_token)
```

Extracted claims:
- `sub` - Unique user identifier
- `email` - User's email address
- `cognito:username` - Username
- `cognito:groups` - User groups (for authorization)

## User Attributes Mapping

The application extracts the following user attributes from Cognito tokens:

| Application Field | Cognito Claim | Fallback |
|------------------|---------------|----------|
| `username` | `cognito:username` | `email` or `sub` |
| `email` | `email` | - |
| `groups` | `cognito:groups` | `[]` |
| `groupname` | First group in `cognito:groups` | `'user'` |
| `company` | `custom:company` | `'default'` |

## Testing the Integration

### Local Development

1. **Start the application:**
   ```bash
   yarn start
   ```

2. **Open the login page:**
   ```
   http://localhost:3000/login
   ```

3. **Click "Sign in with AWS Cognito"**

4. **You'll be redirected to Cognito's hosted UI**

5. **Log in with Cognito credentials**

6. **After successful login, you'll be redirected back to the application**

### Verify Configuration

Check that the callback URL in your browser matches the one configured in Cognito:
```
http://localhost:3000/oauth/callback?code=...&state=...
```

## Troubleshooting

### Problem: "Invalid redirect_uri"

**Cause**: The callback URL doesn't match what's configured in Cognito

**Solution**:
1. Go to AWS Cognito Console
2. Navigate to your User Pool → App Integration → App Client
3. Add `http://localhost:3000/oauth/callback` to Allowed callback URLs
4. Save changes

### Problem: "Invalid client_id or client_secret"

**Cause**: Incorrect credentials in `.env` file

**Solution**:
1. Verify the Client ID in Cognito Console
2. If using Client Secret, verify it matches
3. Update `.env` file
4. Restart the development server

### Problem: "Token exchange failed"

**Cause**: PKCE validation failed or incorrect token endpoint

**Solution**:
1. Check browser console for detailed error
2. Verify token endpoint URL is correct
3. Ensure code_verifier is stored correctly in sessionStorage
4. Try clearing browser storage and retry

### Problem: "User information extraction failed"

**Cause**: ID token doesn't contain expected claims

**Solution**:
1. Check which scopes are configured in Cognito App Client
2. Ensure `openid`, `email`, and `profile` scopes are enabled
3. Check if the ID token is properly decoded (use jwt.io to debug)

## Security Best Practices

### 1. PKCE Implementation
✅ Already implemented - protects against authorization code interception

### 2. State Parameter
✅ Already implemented - prevents CSRF attacks

### 3. Token Storage
- Access tokens stored in localStorage
- Session data in sessionStorage
- Consider using HttpOnly cookies for production

### 4. Client Secret Protection
⚠️ **Important**: Client secrets should ideally not be exposed in frontend code

**Recommended Approach**:
- For public clients (SPAs), use Client ID without secret
- Configure Cognito App Client as "Public client"
- Remove `client_secret` from token exchange

### 5. Token Expiration
- ID tokens typically expire after 1 hour
- Implement refresh token logic for long sessions
- Current implementation doesn't auto-refresh (feature to be added)

## Production Deployment

### 1. Update Environment Variables

Create a production `.env` file:

```bash
REACT_APP_OIDC_REDIRECT_URI=https://your-production-domain.com/oauth/callback
```

### 2. Update Cognito App Client

Add production callback URL in Cognito Console:
```
https://your-production-domain.com/oauth/callback
```

### 3. Enable HTTPS

⚠️ **Critical**: OAuth 2.0 requires HTTPS in production

### 4. Configure CORS

Ensure your API endpoints allow requests from your production domain.

### 5. Monitor and Log

- Set up CloudWatch logs for authentication events
- Monitor failed login attempts
- Track token refresh patterns

## Advanced Features (Future Enhancements)

### 1. Social Identity Providers
Configure Cognito to support:
- Google Sign-In
- Facebook Login
- Apple Sign-In
- SAML 2.0 providers

### 2. Multi-Factor Authentication (MFA)
Enable MFA in Cognito for enhanced security:
- SMS-based MFA
- TOTP (Time-based One-Time Password)

### 3. Custom Domain
Use your own domain instead of Cognito's hosted UI:
```
https://auth.yourdomain.com
```

### 4. Refresh Token Implementation
Add automatic token refresh before expiration:

```javascript
async function refreshAccessToken(refreshToken) {
  // Token refresh logic
}
```

## API Integration

### Using Access Tokens

The application automatically includes the access token in API requests:

```javascript
// Automatically handled by useAuthorizedHeader()
headers: {
  'Authorization': 'Bearer <access_token>'
}
```

### Backend Validation

Your backend should validate the JWT token:

```javascript
// Verify JWT signature using JWKS
const jwksUri = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06/.well-known/jwks.json';
// Use a JWT library to verify the token
```

## Resources

- **Cognito User Pool**: [AWS Console](https://console.aws.amazon.com/cognito/home?region=us-east-1)
- **OIDC Configuration**: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06/.well-known/openid-configuration
- **AWS Documentation**: https://docs.aws.amazon.com/cognito/latest/developerguide/
- **OAuth 2.0 Specification**: https://oauth.net/2/
- **PKCE RFC**: https://tools.ietf.org/html/rfc7636

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console logs
3. Check network tab for failed requests
4. Verify Cognito App Client configuration
5. Contact your AWS administrator
