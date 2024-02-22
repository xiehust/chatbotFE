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

export function getTimestamp() {
    const date = new Date(Date.now() ); // 将秒级时间戳转换为毫秒级时间戳
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
  
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;

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

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
