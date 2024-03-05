// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import axios from 'axios';
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3"

console.log(process.env)
export const API_http = process.env.REACT_APP_API_http.slice(-1) === '/'?
                        process.env.REACT_APP_API_http.slice(0,-1):
                        process.env.REACT_APP_API_http;
export const API_socket = process.env.REACT_APP_API_socket;

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

export const uploadS3 = async (fileob,bucket,objprefix,metadata,region,ak,sk) =>{
    const promiseA = new Promise((resolve, reject)=>{
        uploadS3a(fileob,bucket,objprefix,metadata,region,ak,sk).then(resp =>{
            return resolve('success');
        }).catch(err=>{
            return reject(Error(err));
        })
    });
    //upload a copy to bedrock kb
    const promiseB = new Promise((resolve, reject)=>{
        uploadS3a(fileob,bucket,`bedrock-kb-src/${metadata.company}/${metadata.username}/`,metadata,region,ak,sk).then(resp =>{
            return resolve('success');
        }).catch(err=>{
            return reject(Error(err));
        })
    });
    await Promise.all([promiseA,promiseB]);
}

const uploadS3a = async (fileob,bucket,objprefix,metadata,region,ak,sk) =>{
    const s3Client = new S3Client({ region: region,credentials:{accessKeyId:ak,secretAccessKey:sk}});
    const params = {
        Bucket:bucket,
        Key:`${objprefix}${fileob.name}`,
        Body: fileob,
        Metadata:metadata
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

export const remote_auth_ = async(username,password) =>{
    try {
        const resp = await axios.post(`${API_http}/signin`,JSON.stringify({username:username,password:password}));
        console.log(resp.data);
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const remote_signup = async(username,email,password) =>{
    try {
        const resp = await axios.post(`${API_http}/signup`,JSON.stringify({username:username,password:password,email:email}));
        console.log(resp.data);
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const remote_confirm_signup = async(username,confirmation_code) =>{
    try {
        const resp = await axios.post(`${API_http}/confirm_signup`,JSON.stringify({username:username,confirmation_code:confirmation_code}));
        console.log(resp.data);
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

export const uploadFile = async(username,company,formdata,headers) =>{
    try {
        const resp = await axios.post(`${API_http}/upload?username=${username}&company=${company}`,formdata, {headers,responseType: 'blob'}, );
        // console.log(resp.data);
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const uploadFile2 = async(username,file,headers) =>{
    try {
         const response = await axios.post(`${API_http}/upload?username=${username}`,
                                    JSON.stringify({filename: file.name,filetype:file.type}),
                                    {headers} );
            const { url } = response.data;
            const data = await file.arrayBuffer();
            console.log(data);
            try{
                await axios.put(url, 
                    data,
                    {
                    headers: {
                        "Content-Type": file.type,
                        // "Content-Length": file.size,
                        'x-amz-acl': 'public-read',
                    }
                });
            }
            catch (error2){
                console.error("API Upload failed.", JSON.stringify(error2));
                throw new Error("API Upload failed.", { cause: JSON.stringify(error2) });
            }
          return url
    } catch (err) {
        throw err;
    }
}


export const listDocIdx = async(headers,queryParams={}) =>{
    // Build the query string parameters
    const queryString = Object.keys(queryParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');

    try {
        const resp = await axios.get(`${API_http}/docs?${queryString}`, {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}


export const listTemplate = async(headers,queryParams={}) =>{
    // Build the query string parameters
    const queryString = Object.keys(queryParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');

    try {
        const resp = await axios.get(`${API_http}/template?${queryString}`, {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const addTemplate = async(headers,formdata) =>{
    try {
        const resp = await axios.post(`${API_http}/template`,JSON.stringify(formdata), {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const listAgents = async(headers,queryParams={}) =>{
    // Build the query string parameters
    const queryString = Object.keys(queryParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
    try {
        const resp = await axios.get(`${API_http}/agents?${queryString}`, {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}


export const addPrompt = async(headers,formdata) =>{
    try {
        const resp = await axios.post(`${API_http}/prompt_hub`,JSON.stringify(formdata), {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const deletePrompt = async(headers,formdata) =>{
    try {
        const resp = await axios.delete(`${API_http}/prompt_hub`,{headers,data:JSON.stringify(formdata)});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const getPrompts = async(headers,queryParams={}) =>{
    // Build the query string parameters
    const queryString = Object.keys(queryParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
    try {
        const resp = await axios.get(`${API_http}/prompt_hub?${queryString}`, {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}


export const addAgent = async(headers,formdata) =>{
    try {
        const resp = await axios.post(`${API_http}/agents`,JSON.stringify(formdata), {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const deleteAgent = async(headers,formdata) =>{
    try {
        const resp = await axios.delete(`${API_http}/agents`,{headers,data:JSON.stringify(formdata)});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const postFeedback = async(headers,formdata) =>{
    try {
        const resp = await axios.post(`${API_http}/feedback`,JSON.stringify(formdata), {headers});
        console.log(resp);
        if (resp.data.statusCode >=300){
            throw `error ${resp.data.statusCode}`;
        }else{
            return resp.data;
        }
        
    } catch (err) {
        throw err;
    }
}

export const deleteFeedback = async(headers,formdata) =>{
    try {
        const resp = await axios.delete(`${API_http}/feedback`,{headers,data:JSON.stringify(formdata)});
        if (resp.data.statusCode >=300){
            throw `error ${resp.data.statusCode}`;
        }else{
            return resp.data;
        }
    } catch (err) {
        throw err;
    }
}

export const listFeedback = async(headers,queryParams={}) =>{
    // Build the query string parameters
    const queryString = Object.keys(queryParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');

    try {
        const resp = await axios.get(`${API_http}/feedback?${queryString}`, {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}


export const getTemplate = async(headers,queryParams) =>{
    const queryString = Object.keys(queryParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
    try {
        const resp = await axios.get(`${API_http}/template?${queryString}`, {headers});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const deleteTemplate = async(headers,formdata) =>{
    try {
        const resp = await axios.delete(`${API_http}/template`,{headers,data:JSON.stringify(formdata)});
        return resp.data;
    } catch (err) {
        throw err;
    }
}

export const deleteDoc = async(headers,body) =>{
    try {
        const resp = await axios.delete(`${API_http}/docs`, {headers,data:JSON.stringify(body)});
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

