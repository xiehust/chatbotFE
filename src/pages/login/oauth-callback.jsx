// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../commons/use-auth';
import { exchangeCodeForTokens, extractUserInfo } from '../../common/oauth-utils';

/**
 * OAuth callback handler component
 * This component handles the redirect from the OAuth authorization server
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for error response
        if (errorParam) {
          setError(`Authentication failed: ${errorParam} - ${errorDescription || 'Unknown error'}`);
          setProcessing(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setError('Missing authorization code or state parameter');
          setProcessing(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Exchange authorization code for tokens
        const tokens = await exchangeCodeForTokens(code, state);

        // Extract user information from ID token
        const userInfo = extractUserInfo(tokens.id_token);

        if (!userInfo) {
          setError('Failed to extract user information from ID token');
          setProcessing(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Store tokens and user info
        const authData = {
          ...userInfo,
          token: tokens.access_token,
          id_token: tokens.id_token,
          refresh_token: tokens.refresh_token,
        };

        // Use the auth context to sign in
        auth.signinWithOAuth(authData);

        // Redirect to the main application
        navigate('/prompt_hub');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(`Authentication failed: ${err.message}`);
        setProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, auth]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {processing ? (
          <>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography component="h1" variant="h5">
              Authenticating...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please wait while we complete your sign-in.
            </Typography>
          </>
        ) : (
          <>
            <Typography component="h1" variant="h5" color="error">
              Authentication Error
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Redirecting to login page...
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
};

export default OAuthCallback;
