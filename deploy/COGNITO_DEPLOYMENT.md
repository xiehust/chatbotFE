# AWS Cognito Lambda Authorizer Deployment Guide

## Overview

This guide explains how to deploy the updated Lambda authorizer that supports AWS Cognito JWT token verification.

## What Changed

### Lambda Authorizer Updates

The Lambda authorizer (`deploy/lambda/auth/index.js`) has been updated to:

1. **Verify Cognito JWT tokens** using JWKS (JSON Web Key Set)
2. **Validate token signature** with public keys from Cognito
3. **Check token expiration** and claims
4. **Extract user context** (username, email, groups) from Cognito tokens
5. **Pass user information** to backend Lambda functions

### Key Improvements

| Feature | Old Authorizer | New Authorizer |
|---------|---------------|----------------|
| Token Verification | Simple JWT with shared secret | JWKS with public key cryptography |
| Security | Symmetric key (less secure) | Asymmetric keys (more secure) |
| Cognito Integration | ❌ No | ✅ Yes |
| User Groups | ❌ Not supported | ✅ Supported |
| Token Validation | Basic | Comprehensive (issuer, expiration, token_use) |

## Prerequisites

### 1. AWS Cognito User Pool

You need a Cognito User Pool with the following configuration:

**Current Configuration:**
- User Pool ID: `us-east-1_Sq3IYsy06`
- Region: `us-east-1`
- App Client ID: `682bjuqrjenmreflci9h5189s4`

### 2. Environment Variables

Create or update `.env` file in the `deploy/` directory:

```bash
# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_Sq3IYsy06
COGNITO_REGION=us-east-1

# Other existing variables
TOKEN_KEY=your-token-key
UPLOAD_BUCKET=your-bucket-name
UPLOAD_OBJ_PREFIX=your-prefix/
OPENAI_API_KEY=your-openai-key
START_CMD=your-start-command
```

**Note**: The `TOKEN_KEY` is kept for backward compatibility but not used by the new Cognito authorizer.

## Deployment Steps

### Step 1: Install Dependencies

Navigate to the auth Lambda directory and install dependencies:

```bash
cd deploy/lambda/auth
npm install
```

This will install:
- `jsonwebtoken` - JWT token handling
- `jwks-rsa` - JWKS client for fetching Cognito public keys
- `node-fetch` - HTTP client (dependency of jwks-rsa)

### Step 2: Build and Deploy with CDK

From the `deploy/` directory:

```bash
# Install CDK dependencies (if not already done)
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy
```

The CDK deployment will:
1. Package the Lambda authorizer with dependencies
2. Create/update the Lambda function
3. Set environment variables (COGNITO_USER_POOL_ID, COGNITO_REGION)
4. Attach the authorizer to API Gateway routes
5. Configure necessary IAM permissions

### Step 3: Verify Deployment

After deployment completes:

1. **Check Lambda Function**
   ```bash
   aws lambda get-function --function-name <your-auth-function-name>
   ```

2. **Verify Environment Variables**
   ```bash
   aws lambda get-function-configuration --function-name <your-auth-function-name> \
     --query 'Environment.Variables' --output json
   ```

   Should include:
   ```json
   {
     "COGNITO_USER_POOL_ID": "us-east-1_Sq3IYsy06",
     "COGNITO_REGION": "us-east-1"
   }
   ```

3. **Test the Authorizer**
   - Use API Gateway console to test
   - Or use the test event in Lambda console
   - See `deploy/lambda/auth/README.md` for testing details

### Step 4: Update Frontend

Ensure the frontend is using Cognito tokens:

1. Users log in via Cognito OAuth flow
2. Frontend receives access token
3. Frontend includes token in API requests:
   ```javascript
   headers: {
     'Authorization': 'Bearer <cognito-access-token>'
   }
   ```

## Configuration Details

### CDK Stack Configuration

The Lambda authorizer is configured in `deploy/lib/lambda_stack.js`:

```javascript
this.auth_fn = createNodeJsLambdaFn(
  this,
  "lambda/auth",
  "index.js",
  "lambda_auth",
  {
    ...commonProps,
    environment: {
      ...commonProps.environment,
      COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || 'us-east-1_Sq3IYsy06',
      COGNITO_REGION: process.env.COGNITO_REGION || 'us-east-1',
    },
    bundling: {
      externalModules: ["@aws-sdk"],
      nodeModules: ["jsonwebtoken", "jwks-rsa", "node-fetch"],
    },
  }
);
```

### IAM Permissions

The Lambda function needs:
- ✅ **Internet access** (to fetch JWKS from Cognito)
- ✅ **DynamoDB access** (if reading user data)
- ✅ **CloudWatch Logs** (for logging)

If your Lambda is in a VPC, ensure:
- NAT Gateway for internet access, OR
- VPC Endpoint for Cognito

## Testing

### Manual Testing

1. **Get a Cognito Token**
   ```bash
   # Use AWS CLI or Cognito hosted UI to get a token
   # Token will look like: eyJraWQiOiJ...
   ```

2. **Test with curl**
   ```bash
   curl -X GET https://your-api-gateway-url/prompt_hub \
     -H "Authorization: Bearer <cognito-token>"
   ```

   **Success (200)**: Returns data
   **Failure (401/403)**: Unauthorized

### Automated Testing

See `deploy/lambda/auth/README.md` for detailed testing instructions.

## Monitoring

### CloudWatch Logs

View logs for the authorizer:

```bash
aws logs tail /aws/lambda/<auth-function-name> --follow
```

**Key log messages:**
- `Auth event:` - Incoming authorization request
- `Token verified successfully for user:` - Successful verification
- `Authorization successful for user:` - Policy generated
- `Authorization failed:` - Failed verification (with error details)

### CloudWatch Metrics

Monitor these metrics:

1. **Invocations** - Total authorization requests
2. **Errors** - Failed authorizations
3. **Duration** - Authorization latency
4. **Concurrent Executions** - Active authorizations

### Alarms

Set up alarms for:

```bash
# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name auth-high-error-rate \
  --alarm-description "Alert if auth error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold

# High latency
aws cloudwatch put-metric-alarm \
  --alarm-name auth-high-latency \
  --alarm-description "Alert if auth latency > 1000ms" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold
```

## Troubleshooting

### Problem: CDK Deploy Fails

**Error**: "Cannot find module 'jwks-rsa'"

**Solution**:
```bash
cd deploy/lambda/auth
npm install
cd ../..
cdk deploy
```

### Problem: Lambda Times Out

**Error**: Task timed out after 60.00 seconds

**Possible Causes**:
1. Lambda has no internet access (can't fetch JWKS)
2. Cognito endpoint is unreachable

**Solution**:
1. Check VPC configuration
2. Add NAT Gateway or VPC Endpoint
3. Increase timeout in `lambda_stack.js`:
   ```javascript
   timeout: Duration.minutes(2)
   ```

### Problem: Authorization Always Fails

**Error**: "Token verification failed: invalid signature"

**Check**:
1. COGNITO_USER_POOL_ID is correct
2. Token is from the same User Pool
3. Token is not expired
4. Token is complete (not truncated)

**Debug**:
```bash
# Decode token (do not verify) to check claims
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('YOUR_TOKEN', {complete: true}), null, 2))"
```

### Problem: User Context Not Passed to Backend

**Issue**: Backend Lambda doesn't receive user information

**Check**:
```javascript
// In backend Lambda
exports.handler = async (event) => {
  console.log('Request context:', JSON.stringify(event.requestContext, null, 2));

  const userContext = event.requestContext.authorizer;
  console.log('User context:', userContext);
};
```

**Solution**: Ensure authorizer returns context in the policy.

## Rollback Plan

If you need to rollback to the old authorizer:

### Option 1: Redeploy Previous Version

```bash
git checkout <previous-commit>
cd deploy
cdk deploy
```

### Option 2: Update Environment Variable

Temporarily disable Cognito verification by updating the Lambda code to skip JWKS validation (not recommended for production).

### Option 3: Use API Gateway Console

Manually update the authorizer in API Gateway console to use a different Lambda function.

## Performance Optimization

### 1. Enable Result Caching

In API Gateway, cache authorizer results:

```javascript
// In CDK
const authorizer = new TokenAuthorizer(this, 'Authorizer', {
  handler: authFn,
  resultsCacheTtl: Duration.minutes(5)
});
```

**Benefits**: Reduces Lambda invocations, improves response time
**Caution**: Cached results may be stale if user permissions change

### 2. Increase Memory

More memory = more CPU = faster execution:

```javascript
memorySize: 512  // Increased from 256
```

### 3. Use Provisioned Concurrency

For high-traffic APIs:

```javascript
const authFnVersion = authFn.currentVersion;
authFnVersion.addAlias('live', {
  provisionedConcurrentExecutions: 5
});
```

## Security Best Practices

### 1. Least Privilege IAM

Grant only necessary permissions:

```javascript
authFn.addToRolePolicy(new iam.PolicyStatement({
  actions: ['dynamodb:GetItem'],  // Not *
  resources: [userTable.tableArn]
}));
```

### 2. Enable CloudTrail

Log all API calls:

```bash
aws cloudtrail create-trail \
  --name auth-audit \
  --s3-bucket-name my-audit-bucket
```

### 3. Rotate Secrets

Regularly rotate:
- Cognito App Client secrets
- Any other secrets in environment variables

### 4. Monitor Failed Attempts

Set up alerts for:
- High rate of authorization failures
- Unusual access patterns
- Token validation errors

## Cost Optimization

### Estimated Costs

Based on 1 million API requests/month:

| Component | Requests | Cost |
|-----------|----------|------|
| Lambda Authorizer | 1M invocations | ~$0.20 |
| API Gateway | 1M requests | ~$3.50 |
| CloudWatch Logs | 1GB logs | ~$0.50 |
| **Total** | | **~$4.20/month** |

**Cost Savings with Caching**:
- 5-minute cache TTL: ~80% reduction in Lambda invocations
- Estimated savings: ~$0.16/month on Lambda

### Cost Monitoring

```bash
# Get Lambda costs
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --filter file://lambda-filter.json
```

## Next Steps

After successful deployment:

1. ✅ Test end-to-end: Frontend → API Gateway → Lambda Authorizer → Backend
2. ✅ Monitor CloudWatch logs for errors
3. ✅ Set up alarms for failures and latency
4. ✅ Document any custom configurations
5. ✅ Train team on new authentication flow
6. ✅ Update runbooks and incident response procedures

## Support

For issues or questions:
1. Check `deploy/lambda/auth/README.md`
2. Review CloudWatch logs
3. Verify Cognito configuration
4. Test with jwt.io
5. Contact AWS support if needed

## Resources

- [Lambda Authorizers Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [Cognito JWT Tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [JWKS Specification](https://tools.ietf.org/html/rfc7517)
