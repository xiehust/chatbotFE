// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const jwt = require("jsonwebtoken");
const jwksClient = require('jwks-rsa');

// Cognito Configuration
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_Sq3IYsy06';
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
const JWKS_URI = `${COGNITO_ISSUER}/.well-known/jwks.json`;

// JWKS client for fetching public keys
const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

/**
 * Get signing key from JWKS
 */
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error getting signing key:', err);
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify Cognito JWT token
 */
async function verifyCognitoToken(token) {
  return new Promise((resolve, reject) => {
    // Decode token header to get kid
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader) {
      reject(new Error('Invalid token format'));
      return;
    }

    // Verify token with JWKS public key
    jwt.verify(
      token,
      getKey,
      {
        issuer: COGNITO_ISSUER,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          console.error('Token verification failed:', err.message);
          reject(err);
          return;
        }

        // Additional validation
        const currentTime = Math.floor(Date.now() / 1000);

        // Check token expiration
        if (decoded.exp && decoded.exp < currentTime) {
          reject(new Error('Token expired'));
          return;
        }

        // Check token_use claim
        if (decoded.token_use !== 'access' && decoded.token_use !== 'id') {
          reject(new Error('Invalid token_use claim'));
          return;
        }

        console.log('Token verified successfully for user:', decoded['cognito:username'] || decoded.sub);
        resolve(decoded);
      }
    );
  });
}

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(principalId, effect, resource, context = {}) {
  const authResponse = {
    principalId: principalId
  };

  if (effect && resource) {
    authResponse.policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    };
  }

  // Add user context to pass to backend
  if (Object.keys(context).length > 0) {
    authResponse.context = context;
  }

  return authResponse;
}

/**
 * Extract user information from decoded token
 */
function extractUserInfo(decoded) {
  return {
    username: decoded['cognito:username'] || decoded.username || decoded.sub,
    sub: decoded.sub,
    email: decoded.email || '',
    groups: JSON.stringify(decoded['cognito:groups'] || []),
    token_use: decoded.token_use || '',
    client_id: decoded.client_id || decoded.aud || ''
  };
}

/**
 * Lambda authorizer handler
 */
exports.handler = async (event) => {
  console.log('Auth event:', JSON.stringify(event, null, 2));

  const token = event.authorizationToken || event.headers?.Authorization || event.headers?.authorization;

  // Check if token exists
  if (!token) {
    console.error('No authorization token provided');
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  try {
    // Extract token from "Bearer <token>" format
    const tokenValue = token.startsWith('Bearer ') ? token.substring(7) : token;

    if (!tokenValue) {
      console.error('Token is empty after extraction');
      return generatePolicy('user', 'Deny', event.methodArn);
    }

    // Verify Cognito JWT token
    const decoded = await verifyCognitoToken(tokenValue);

    // Extract user information
    const userInfo = extractUserInfo(decoded);

    console.log('Authorization successful for user:', userInfo.username);

    // Generate Allow policy with user context
    return generatePolicy(
      userInfo.sub,
      'Allow',
      event.methodArn,
      userInfo
    );

  } catch (error) {
    console.error('Authorization failed:', error.message);
    console.error('Error stack:', error.stack);

    // Return Deny policy
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};
