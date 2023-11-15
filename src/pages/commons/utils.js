// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
export function formatDate(date){
    if (typeof date == 'string') {
        return date;
    }
    var fmt = "yyyy-MM-dd hh:mm:ss";
    if (!date || date == null) return null;
    var opt = {
        'y+': date.getFullYear().toString(), 
        'M+': (date.getMonth() + 1).toString(), 
        'd+': date.getDate().toString(), 
        'h+': date.getHours().toString(), 
        'm+': date.getMinutes().toString(), 
        's+': date.getSeconds().toString()      
      }
      for (const k in opt) {
        const ret = new RegExp('(' + k + ')').exec(fmt)
        if (ret) {
          if (/(y+)/.test(k)) {
            fmt = fmt.replace(ret[1], opt[k].substring(4 - ret[1].length))
          } else {
            fmt = fmt.replace(ret[1], (ret[1].length === 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, '0')))
          }
        }
      }
    return fmt
}


export function dbRespErrorMapping(err){
  switch (err){
    case 501:
      return "Failed to connect to Database";
    case 502:
      return "Failed to insert data to Database";
    default:
      return "Internal Server Error";
  }
}

// Function to set a cookie with an expiration date
const cookieName ='chatbotFE-token-expiration';
export function setExpiresInCookie(sec) {
  if (sec) {
    const date = new Date();
    date.setTime(date.getTime() + (sec * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = cookieName + "=" + expires + "; path=/";
  }
}

// Function to get the value of a cookie by its name
function getCookie() {
  const nameEQ = cookieName + "=";
  const cookies = document.cookie.split(';');
  // console.log(cookies)
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}



export function isTokenExpires () {
  const storedExpiration = getCookie();
  // Compare the expiration date with the current date
  if (storedExpiration) {
    const currentDate = new Date();
    const expiration = new Date(storedExpiration);
    if (currentDate > expiration) {
      console.log("The cookie has expired.");
      return true;
    } else {
      // console.log("The cookie is still valid.");
      return false
    }
  } else {
    console.log("The cookie does not exist.");
    return true;
  }
}