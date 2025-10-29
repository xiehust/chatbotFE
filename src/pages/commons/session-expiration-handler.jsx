// Session expiration handler component
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress } from '@mui/material';
import { Warning as WarningIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from './use-auth';
import { isTokenExpired, getTokenExpirationTime } from '../../common/oauth-utils';

/**
 * Component to monitor token expiration and provide user feedback
 */
export function SessionExpirationHandler() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!auth.user || !auth.user.token) {
      return;
    }

    // Check token expiration every 30 seconds
    const checkInterval = setInterval(() => {
      const token = auth.user.token;

      if (!token) {
        clearInterval(checkInterval);
        return;
      }

      // Check if token is expired (no buffer)
      if (isTokenExpired(token, 0)) {
        console.log('Token has expired');
        clearInterval(checkInterval);
        setShowExpired(true);
        return;
      }

      // Get time until expiration
      const expirationTime = getTokenExpirationTime(token);

      if (expirationTime !== null) {
        setTimeRemaining(expirationTime);

        // Show warning if less than 5 minutes remaining
        if (expirationTime <= 300 && expirationTime > 0) {
          if (!showWarning) {
            console.log(`Token will expire in ${expirationTime}s, showing warning`);
            setShowWarning(true);
          }
        } else {
          if (showWarning) {
            setShowWarning(false);
          }
        }
      }
    }, 30000); // Check every 30 seconds

    // Initial check
    const token = auth.user.token;
    if (isTokenExpired(token, 0)) {
      setShowExpired(true);
    } else {
      const expirationTime = getTokenExpirationTime(token);
      if (expirationTime !== null) {
        setTimeRemaining(expirationTime);
        if (expirationTime <= 300) {
          setShowWarning(true);
        }
      }
    }

    return () => {
      clearInterval(checkInterval);
    };
  }, [auth.user, showWarning]);

  const handleRefresh = async () => {
    try {
      await auth.refreshToken();
      setShowWarning(false);
      setShowExpired(false);
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      handleRelogin();
    }
  };

  const handleRelogin = () => {
    setShowWarning(false);
    setShowExpired(false);
    auth.signout();
    navigate('/login');
  };

  const formatTime = (seconds) => {
    if (seconds === null) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <>
      {/* Warning dialog - token expiring soon */}
      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Session Expiring Soon
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your session will expire in approximately <strong>{formatTime(timeRemaining)}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your session will be automatically refreshed, or you can refresh it now.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarning(false)}>
            Dismiss
          </Button>
          <Button
            variant="contained"
            startIcon={auth.isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={auth.isRefreshing}
          >
            Refresh Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expired dialog - token has expired */}
      <Dialog open={showExpired} disableEscapeKeyDown>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Session Expired
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your session has expired for security reasons.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please sign in again to continue using the application.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRelogin}
            fullWidth
          >
            Sign In Again
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SessionExpirationHandler;
