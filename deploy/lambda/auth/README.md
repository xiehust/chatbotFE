# Lambda Authorizer for API Gateway with Cognito JWT Verification

This Lambda function serves as a custom authorizer for API Gateway, validating JWT tokens issued by AWS Cognito.

## Overview

This authorizer:
- Validates JWT tokens from AWS Cognito User Pool
- Verifies token signature using JWKS (JSON Web Key Set)
- Checks token expiration and claims
- Generates IAM policy for API Gateway access
- Passes user context to backend Lambda functions

## Architecture

```
User Request → API Gateway → Lambda Authorizer → Backend Lambda
                   ↓              ↓
              (JWT Token)   (Verify with Cognito JWKS)
                                  ↓
                            Allow/Deny Policy
```

## Configuration

### Environment Variables

The Lambda function uses the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `COGNITO_USER_POOL_ID` | `us-east-1_Sq3IYsy06` | Cognito User Pool ID |
| `COGNITO_REGION` | `us-east-1` | AWS Region for Cognito |

### Cognito Configuration

**Current Configuration:**
- User Pool ID: `us-east-1_Sq3IYsy06`
- Region: `us-east-1`
- JWKS URI: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06/.well-known/jwks.json`

## How It Works

### 1. Token Extraction

The authorizer extracts the JWT token from the request:
- From `authorizationToken` field (TOKEN authorizer type)
- From `Authorization` header (REQUEST authorizer type)
- Supports both `Bearer <token>` and plain token formats

### 2. Token Verification

Verifies the JWT token by:
1. Decoding the token header to get the `kid` (key ID)
2. Fetching the corresponding public key from Cognito JWKS endpoint
3. Verifying the token signature using the public key
4. Validating the issuer matches the Cognito User Pool
5. Checking token expiration
6. Validating the `token_use` claim (must be 'access' or 'id')

### 3. User Context Extraction

Extracts user information from the verified token:
- `username` - Cognito username
- `sub` - User unique identifier
- `email` - User email address
- `groups` - User groups (JSON stringified array)
- `token_use` - Token type (access or id)
- `client_id` - App client ID

### 4. Policy Generation

Generates an IAM policy:
- **Allow** - If token is valid
- **Deny** - If token is invalid, expired, or missing

The policy includes user context that is passed to backend Lambda functions via `event.requestContext.authorizer`.

## Installation

### 1. Install Dependencies

```bash
cd deploy/lambda/auth
npm install
```

Dependencies:
- `jsonwebtoken` - JWT decoding and verification
- `jwks-rsa` - JWKS client for fetching public keys
- `node-fetch` - HTTP client (used by jwks-rsa)

### 2. Deploy

The Lambda function is automatically deployed via AWS CDK when you deploy the backend stack.

## Testing

### Local Testing

Create a test event file `test-event.json`:

```json
{
  "type": "TOKEN",
  "authorizationToken": "Bearer eyJraWQiOiJ...",
  "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/GET/resource"
}
```

Run locally:

```bash
node -e "const handler = require('./index').handler; handler(require('./test-event.json')).then(console.log).catch(console.error);"
```

### Test in AWS Console

1. Go to Lambda Console
2. Select the authorizer function
3. Create a test event with the format above
4. Use a real JWT token from Cognito
5. Click "Test"

Expected successful response:

```json
{
  "principalId": "user-sub-id",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow",
        "Resource": "arn:aws:execute-api:..."
      }
    ]
  },
  "context": {
    "username": "testuser",
    "sub": "12345678-1234-1234-1234-123456789012",
    "email": "test@example.com",
    "groups": "[\"admin\"]",
    "token_use": "access",
    "client_id": "abc123xyz"
  }
}
```

## Accessing User Context in Backend

Backend Lambda functions can access the user context:

```javascript
exports.handler = async (event) => {
  const userContext = event.requestContext.authorizer;

  const username = userContext.username;
  const email = userContext.email;
  const groups = JSON.parse(userContext.groups);

  console.log('User:', username);
  console.log('Email:', email);
  console.log('Groups:', groups);

  // Your business logic here
};
```

## Caching

The authorizer implements caching:

### JWKS Caching
- Public keys are cached for 10 minutes
- Reduces calls to Cognito JWKS endpoint
- Improves performance

### API Gateway Caching
Configure TTL in API Gateway:
```javascript
// In CDK stack
authorizer.authorizerResultTtlInSeconds = 300; // 5 minutes
```

**Important**: Be careful with caching if you revoke tokens or change user groups frequently.

## Security Considerations

### 1. Token Validation
- ✅ Signature verification using JWKS
- ✅ Issuer validation
- ✅ Expiration check
- ✅ Token use claim validation

### 2. Error Handling
- Errors are logged but not exposed to clients
- Always returns Allow or Deny (never throws)

### 3. Rate Limiting
- JWKS client limits requests to 10/minute
- Prevents DDoS on Cognito endpoints

### 4. Best Practices
- ⚠️ Use short token expiration (1 hour recommended)
- ⚠️ Implement token refresh mechanism in frontend
- ⚠️ Monitor failed authorization attempts
- ⚠️ Use HTTPS only

## Troubleshooting

### Problem: "Token verification failed: invalid signature"

**Cause**: Token was signed with a different key or is corrupted

**Solution**:
1. Ensure token is from the correct Cognito User Pool
2. Check if token is complete (not truncated)
3. Verify COGNITO_USER_POOL_ID environment variable

### Problem: "Token expired"

**Cause**: Token has exceeded its expiration time

**Solution**:
1. Implement token refresh in frontend
2. Use refresh tokens to get new access tokens
3. Check client system time

### Problem: "Invalid token_use claim"

**Cause**: Token is not an access or id token

**Solution**:
1. Ensure you're sending an access_token or id_token (not refresh_token)
2. Check token claims using jwt.io

### Problem: "Error getting signing key"

**Cause**: Cannot fetch JWKS from Cognito

**Solution**:
1. Check Lambda has internet access (or VPC endpoints)
2. Verify JWKS_URI is correct
3. Check Cognito User Pool exists and is in correct region

### Problem: "No authorization token provided"

**Cause**: Token is missing from request

**Solution**:
1. Ensure frontend sends `Authorization: Bearer <token>` header
2. Check API Gateway configuration passes authorization header
3. Verify authorizer is attached to the route

## Monitoring

### CloudWatch Logs

View logs in CloudWatch:
```bash
aws logs tail /aws/lambda/your-authorizer-function-name --follow
```

Key log messages:
- "Auth event:" - Shows incoming request
- "Token verified successfully for user:" - Successful auth
- "Authorization successful for user:" - Policy generated
- "Authorization failed:" - Failed auth with error

### Metrics to Monitor

- Authorization success rate
- Authorization latency
- JWKS fetch errors
- Token validation errors

### Alarms

Set up CloudWatch alarms for:
- High error rate (> 5%)
- High latency (> 1000ms)
- Frequent JWKS fetch failures

## Performance

### Cold Start
- First invocation: ~500-1000ms
- Subsequent invocations: ~100-200ms

### Optimization Tips
1. Use provisioned concurrency for critical APIs
2. Increase memory allocation (more CPU)
3. Enable caching in API Gateway
4. Monitor and optimize JWKS cache settings

## Migration from Old Authorizer

### Old Authorizer (Simple JWT)
```javascript
jwt.verify(token, process.env.TOKEN_KEY);
```

### New Authorizer (Cognito JWKS)
```javascript
verifyCognitoToken(token); // Fetches public key from JWKS
```

### Breaking Changes
- No longer uses `TOKEN_KEY` environment variable
- Now requires `COGNITO_USER_POOL_ID` and `COGNITO_REGION`
- User context structure changed (see Accessing User Context section)

### Migration Steps
1. Update Lambda code (already done)
2. Install new dependencies
3. Update environment variables
4. Test with Cognito tokens
5. Deploy to production
6. Monitor for issues

## Resources

- [AWS Lambda Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [Cognito JWT Tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [JWKS Specification](https://tools.ietf.org/html/rfc7517)
- [JWT Verification](https://jwt.io/)

## Support

For issues or questions:
1. Check CloudWatch logs
2. Verify Cognito configuration
3. Test with jwt.io
4. Review troubleshooting section above
