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