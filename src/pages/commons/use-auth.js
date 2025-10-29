// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useEffect, useContext, createContext } from "react";
import { useNavigate } from "react-router-dom";
import {useLocalStorage} from "../../common/localStorage";
// import remoteApis from './remote-apis';
import {remote_auth,remote_signup,remote_confirm_signup} from './api-gateway';
import {localStoreKey} from '../../common/shared';
import { setupApiInterceptors, clearApiInterceptors } from '../../common/api-interceptor';
import { useTokenRefresh } from '../../common/use-token-refresh';

const authContext = createContext();
// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
export function ProvideAuth({ children }) {
    const auth = useProvideAuth();

    // Setup API interceptors for token refresh
    useEffect(() => {
      const handleTokenExpired = () => {
        console.log('Token expired, signing out...');
        auth.signout();
        // Redirect happens in the interceptor
      };

      setupApiInterceptors(handleTokenExpired);

      return () => {
        clearApiInterceptors();
      };
    }, [auth]);

    // console.log('ProvideAuth',auth);
    return <authContext.Provider value={auth}>{children}</authContext.Provider>;
  }

export function useAuthSignout () {
    const auth = useProvideAuth();
    return auth.signout;
}


export function useAuthToken(){
  const auth = useAuth();
  const [local_stored_tokendata] = useLocalStorage(localStoreKey,null);
  const user = auth.user?auth.user:local_stored_tokendata;
  const token = user.token;
  return {'token':'Bearer '+token}
}


export function useAuthUserInfo(){
    const auth = useAuth();
    const [local_stored_tokendata] = useLocalStorage(localStoreKey,null)
    const user = auth.user?auth.user:local_stored_tokendata;
    return {
          username:user?user.username:undefined,
          company:user?user.company:undefined,
          groupname:user?user.groupname:undefined,
          token:user?user.token:undefined,
        };
  }

export function useAuthorizedHeader(){
    const auth = useAuth();
    const [local_stored_tokendata] = useLocalStorage(localStoreKey,null)
    const authdata = auth.user?auth.user:local_stored_tokendata;
    const token = authdata.token;
    return {
            'Content-Type':'application/json;charset=utf-8',
            'Authorization':'Bearer '+token
        };
  }

// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useAuth = () => {
    return useContext(authContext);
  };
  
  // Provider hook that creates auth object and handles state
function useProvideAuth() {
    const [user, setUser] = useState();
    const [,setToken] = useLocalStorage(localStoreKey,null);

    // Callback to update auth state after token refresh
    const updateAuthState = (newAuthData) => {
      if (newAuthData) {
        setToken(newAuthData);
        setUser(newAuthData);
      } else {
        setToken(null);
        setUser(null);
      }
    };

    // Setup token refresh hook
    const { refreshToken, isRefreshing } = useTokenRefresh(updateAuthState);

    // Wrap any Firebase methods we want to use making sure ...
    // ... to save the user to state.
    const signin = (email, password) => {
      return remote_auth(email,password).then(data => {
        setToken(data);
        setUser(data);
        return data;
    });
    };

    const signinWithOAuth = (authData) => {
      // Store OAuth authentication data
      setToken(authData);
      setUser(authData);
      return authData;
    };

    const signout = () => {
      setToken(null);
      setUser(null);
      // Clear any pending refresh timers
      return null;
    };

    const signup =(username,email,password) =>{
      return remote_signup(username,email,password).then(data => data);
    };

    const confirm_signup = (username,confirmcode)=>{
      return remote_confirm_signup(username,confirmcode).then(data => data);
    };


    // Return the user object and auth methods
    return {
      user,
      signin,
      signinWithOAuth,
      signout,
      signup,
      confirm_signup,
      refreshToken,
      isRefreshing,
    };
  } 