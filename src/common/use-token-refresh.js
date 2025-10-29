// Token refresh hook for automatic token renewal
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshAccessToken, isTokenExpired, getTokenExpirationTime } from './oauth-utils';
import { useLocalStorage } from './localStorage';
import { localStoreKey } from './shared';

/**
 * Hook to automatically refresh tokens before they expire
 * @param {Function} updateAuthCallback - Callback to update auth state with new tokens
 */
export function useTokenRefresh(updateAuthCallback) {
  const navigate = useNavigate();
  const [storedAuth, setStoredAuth] = useLocalStorage(localStoreKey, null);
  const refreshTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);

  /**
   * Refresh the access token
   */
  const performTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('Token refresh already in progress, skipping...');
      return;
    }

    if (!storedAuth || !storedAuth.refresh_token) {
      console.log('No refresh token available, user needs to re-login');
      return;
    }

    try {
      isRefreshingRef.current = true;
      console.log('Refreshing access token...');

      const newTokens = await refreshAccessToken(storedAuth.refresh_token);

      // Update stored auth data
      const updatedAuthData = {
        ...storedAuth,
        token: newTokens.access_token,
        id_token: newTokens.id_token,
        refresh_token: newTokens.refresh_token,
      };

      // Update local storage
      setStoredAuth(updatedAuthData);

      // Update auth context
      if (updateAuthCallback) {
        updateAuthCallback(updatedAuthData);
      }

      console.log('Token refreshed successfully');

      // Schedule next refresh
      scheduleTokenRefresh(newTokens.access_token);
    } catch (error) {
      console.error('Token refresh failed:', error);

      // If refresh fails, clear auth and redirect to login
      handleTokenExpiration();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [storedAuth, setStoredAuth, updateAuthCallback, navigate]);

  /**
   * Handle token expiration by clearing auth and redirecting to login
   */
  const handleTokenExpiration = useCallback(() => {
    console.log('Token expired and refresh failed. Redirecting to login...');

    // Clear all stored auth data
    setStoredAuth(null);
    if (updateAuthCallback) {
      updateAuthCallback(null);
    }

    // Clear session storage
    sessionStorage.clear();

    // Show notification to user
    alert('Your session has expired. Please sign in again.');

    // Redirect to login
    navigate('/login');
  }, [setStoredAuth, updateAuthCallback, navigate]);

  /**
   * Schedule next token refresh based on expiration time
   */
  const scheduleTokenRefresh = useCallback((accessToken) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    if (!accessToken) {
      return;
    }

    // Get time until token expires
    const expirationTime = getTokenExpirationTime(accessToken);

    if (expirationTime === null) {
      console.warn('Could not determine token expiration time');
      return;
    }

    // Refresh 5 minutes before expiration (or at 50% of token lifetime, whichever is smaller)
    const refreshBuffer = Math.min(300, expirationTime * 0.5);
    const refreshIn = Math.max(0, expirationTime - refreshBuffer);

    console.log(`Token expires in ${expirationTime}s, scheduling refresh in ${refreshIn}s`);

    // Schedule refresh
    refreshTimerRef.current = setTimeout(() => {
      performTokenRefresh();
    }, refreshIn * 1000);
  }, [performTokenRefresh]);

  /**
   * Check token and schedule refresh on mount
   */
  useEffect(() => {
    if (!storedAuth || !storedAuth.token) {
      return;
    }

    // Check if token is already expired
    if (isTokenExpired(storedAuth.token, 0)) {
      console.log('Token is already expired, attempting refresh...');
      performTokenRefresh();
    } else {
      // Schedule automatic refresh
      scheduleTokenRefresh(storedAuth.token);
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [storedAuth?.token, performTokenRefresh, scheduleTokenRefresh]);

  return {
    refreshToken: performTokenRefresh,
    isRefreshing: isRefreshingRef.current,
  };
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
