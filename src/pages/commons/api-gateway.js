// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import axios from 'axios';
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3"

export const API_http = 'https://rf52ycna47.execute-api.us-west-2.amazonaws.com/prod/';
export const API_socket = 'wss://7bk6ty9c65.execute-api.us-east-2.amazonaws.com/Prod';

export const API_login = 'login';
export const API_users = 'users';


export const remoteGetCall = async (headers,api,params,controller) =>{
    try {
        const resp = await axios.get(`${API_http}/${api}`, 
            {headers,
            params:params??null,
            signal:controller?controller.signal:null
            });
        // console.log(resp.data);  
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const uploadS3 = async (fileob,bucket,objprefix,region,ak,sk) =>{
    const s3Client = new S3Client({ region: region,credentials:{accessKeyId:ak,secretAccessKey:sk}});
    const params = {
        Bucket:bucket,
        Key:`${objprefix}${fileob.name}`,
        Body: fileob,
    }
    const command = new PutObjectCommand(params);
    try {
        const response = await s3Client.send(command);
        console.log(`File uploaded successfully. ${response}`);
      } catch (err) {
        console.log(`Error uploading file to S3: ${err}`);
        throw(err);
      }

}
export const remotePostCall = async (headers,api,payload) =>{
    try {
        const resp = await axios.post(`${API_http}/${api}`,JSON.stringify(payload), {headers});
        // console.log(resp.data);
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const remote_auth = async(username,password) =>{
    const options = {
        method:"POST",
        headers:{
            "Access-Control-Request-Headers": 'Content-Type, Authorization',
            "Authorization":`${username}:${password}`}
    };
    // const dummy = {"isAuthorized":true,
    //                 "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoicml2ZXIiLCJpYXQiOjE2ODY2NDE3NjcsImV4cCI6MTY4NjcyODE2N30.UCpf0g4ioQta5SHatij08r4jgJmSVQUM-Ia2fUcJplM",
    //                 "username":"user001",
    //                 "groupname":"admin"}
    // return dummy
    return fetch(API_http + '/'+API_login, options)
            .then(resp=>{
                if (!resp.ok){
                    console.error(`Response error: ${resp}`);
                    const res = {"isAuthorized": false, "context": {"code": resp.status, "msg": resp.message}}
                    return res;
                }
                return resp.json();
                })
                .then(data => (data))
}

export const uploadFile = async(filename,formdata,headers) =>{
    try {
        const resp = await axios.post(`${API_http}/upload`,formdata, {headers,responseType: 'blob'}, );
        // console.log(resp.data);
        return resp.data;
    } catch (err) {
        throw err;
    }
}


export const listDocIdx = async(headers) =>{
    try {
        const resp = await axios.get(`${API_http}/docs`, {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }

}

export const getAnswer = async(respid,text,model_params,headers) =>{
    const options ={
        method:'POST',
        // mode: 'no-cors',
        headers:headers,
        body:JSON.stringify({id:respid,prompt:text,params:model_params})
    }
    try {
        const resp = await fetch(API_http+'/chat', options);
       
        if (!resp.ok){
            const data = await resp.text();
            throw (Error(`Error: ${resp.status},${data}`));
        } 
        const data = await resp.json() ;
        return data;
    } catch (err) {
        throw err;
    }
}

