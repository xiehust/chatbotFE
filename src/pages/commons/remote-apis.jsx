// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
export default class remoteApis {

 
    apigw_endpoint = "https://cahn57ybfh.execute-api.ap-northeast-1.amazonaws.com/";

    async loginApi(username,password,updateFunc){
        const options = {
            method:"POST",
            headers:{"Authorization":`${username}:${password}`,
        }
        };
        let resp = await fetch(this.apigw_endpoint + "login", options);
        let data = await resp.json();
        updateFunc(data);
    }

    auth(username,password){
        const options = {
            method:"POST",
            headers:{"Authorization":`${username}:${password}`}
        };
        return fetch(this.apigw_endpoint + "login", options)
                .then(resp=>{
                    if (!resp.ok){
                        console.error(`Response error: ${resp.status}`);
                        var res = {"isAuthorized": false, "context": {"code": resp.status, "msg": "Internal Error"}}
                        return res;
                    }
                    return resp.json();
                    }).then(data => (data))
    }

    invokeAPIGW(api,options){
        return fetch(this.apigw_endpoint + api, options)
                .then(resp =>{
                    // console.log(resp);
                    if (!resp.ok){
                        console.error(`Response error: ${resp.status}`);
                        return resp.status;
                    }
                    return resp.json();
                }).then(data => (data));
    }

    invokeAPIGW_nj(api,options){
        return fetch(this.apigw_endpoint + api, options)
                .then(resp =>{
                    if (!resp.ok){
                        throw (`Response error: ${resp.status}`);
                    }
                    return resp.json();
                }).catch(err => {
                    throw err;
                });
    }

    async invokeAPIGW_2 (api,options) {
        let resp;
        let data;
        try {
            resp = await fetch(this.apigw_endpoint + api, options);
            // console.log(resp);
            if (!resp.ok) throw (`Response error: ${resp.status}`);
            data = await resp.json() ;
            return data;
        } catch (err) {
            throw err;
        }
    }

} 
