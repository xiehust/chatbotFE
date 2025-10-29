// API interceptor to handle token expiration and automatic refresh
import axios from 'axios';
import { refreshAccessToken, isTokenExpired } from './oauth-utils';
import { localStoreKey } from './shared';

let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Setup axios interceptors for automatic token refresh
 */
export function setupApiInterceptors(onTokenExpired) {
  // Request interceptor - check token before request
  axios.interceptors.request.use(
    async (config) => {
      const authDataStr = localStorage.getItem(localStoreKey);
      if (!authDataStr) {
        return config;
      }

      try {
        const authData = JSON.parse(authDataStr);
        const accessToken = authData.token;

        // Check if token is expired or about to expire (within 1 minute)
        if (accessToken && isTokenExpired(accessToken, 60)) {
          console.log('Access token is expired or expiring soon, refreshing...');

          if (authData.refresh_token) {
            // Wait if already refreshing
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then(token => {
                  config.headers['Authorization'] = 'Bearer ' + token;
                  return config;
                })
                .catch(err => {
                  return Promise.reject(err);
                });
            }

            isRefreshing = true;

            try {
              const newTokens = await refreshAccessToken(authData.refresh_token);

              // Update stored auth data
              const updatedAuthData = {
                ...authData,
                token: newTokens.access_token,
                id_token: newTokens.id_token,
                refresh_token: newTokens.refresh_token,
              };

              localStorage.setItem(localStoreKey, JSON.stringify(updatedAuthData));

              // Update request header
              config.headers['Authorization'] = 'Bearer ' + newTokens.access_token;

              // Process queued requests
              processQueue(null, newTokens.access_token);

              isRefreshing = false;

              console.log('Token refreshed successfully before request');
            } catch (error) {
              console.error('Token refresh failed:', error);
              processQueue(error, null);
              isRefreshing = false;

              // Token refresh failed, redirect to login
              if (onTokenExpired) {
                onTokenExpired();
              }

              return Promise.reject(error);
            }
          }
        }
      } catch (error) {
        console.error('Error in request interceptor:', error);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle 401 errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Check if error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        console.log('Received 401 Unauthorized, attempting token refresh...');

        const authDataStr = localStorage.getItem(localStoreKey);
        if (!authDataStr) {
          if (onTokenExpired) {
            onTokenExpired();
          }
          return Promise.reject(error);
        }

        const authData = JSON.parse(authDataStr);

        if (!authData.refresh_token) {
          console.log('No refresh token available');
          if (onTokenExpired) {
            onTokenExpired();
          }
          return Promise.reject(error);
        }

        // Prevent infinite retry loop
        originalRequest._retry = true;

        // Wait if already refreshing
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return axios(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        isRefreshing = true;

        try {
          const newTokens = await refreshAccessToken(authData.refresh_token);

          // Update stored auth data
          const updatedAuthData = {
            ...authData,
            token: newTokens.access_token,
            id_token: newTokens.id_token,
            refresh_token: newTokens.refresh_token,
          };

          localStorage.setItem(localStoreKey, JSON.stringify(updatedAuthData));

          // Update original request with new token
          originalRequest.headers['Authorization'] = 'Bearer ' + newTokens.access_token;

          // Process queued requests
          processQueue(null, newTokens.access_token);

          isRefreshing = false;

          console.log('Token refreshed successfully after 401');

          // Retry original request
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed after 401:', refreshError);
          processQueue(refreshError, null);
          isRefreshing = false;

          // Token refresh failed, redirect to login
          if (onTokenExpired) {
            onTokenExpired();
          }

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Clear axios interceptors
 */
export function clearApiInterceptors() {
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
}
