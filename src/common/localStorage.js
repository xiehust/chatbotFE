// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useState } from 'react';
import {localStoreKey} from './shared'
export const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const load = key => {

  if (key === localStoreKey){
      if (!getCookie(localStoreKey)){
        console.log('token expired');
        return undefined;
      }
  }

  const value = localStorage.getItem(key);
  try {
    return value && JSON.parse(value);
  } catch (e) {
    console.warn(
      `⚠️ The ${key} value that is stored in localStorage is incorrect. Try to remove the value ${key} from localStorage and reload the page`
    );
    return undefined;
  }
};

export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => load(key) ?? defaultValue);

  function handleValueChange(newValue) {
    setValue(newValue);
    if (newValue === null){
        eraseCookie(localStoreKey);
    }
    if (key === localStoreKey){
      setCookie(localStoreKey,'token saved',30);
    }
    save(key, newValue);
  }
  

  return [value, handleValueChange];
};

function setCookie(name,value,days) {
  let expires = "";
  if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
  let nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
      let c = ca[i];
      while (c.charAt(0)===' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}
function eraseCookie(name) {   
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}