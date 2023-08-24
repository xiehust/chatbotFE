// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { DynamoDBClient, ScanCommand,DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const TABLE_NAME = 'chatbot_doc_index';
const cors_headers = {
    "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*"
  }

const scanTableData = async () => {
    const client = new DynamoDBClient();
    const params = {
      TableName: TABLE_NAME,
    };
    let retItems = [];
    const command = new ScanCommand(params);
    try {
      const results = await client.send(command);
      if (!results.Items) {
        return retItems;
      } else {
        
        results.Items.forEach((item) => {
          let attributes = {};
          Object.keys(item).forEach((key) => {
            attributes[key] = item[key].S || item[key].N || item[key].BOOL;
          });
          retItems.push(attributes)
        });
        return retItems
      }
    } catch (err) {
      console.error(err);
      return retItems;
    }
  };
  
const deleteItem = async (filename,embedding_model)=>{
  const client = new DynamoDBClient();
  const params = {
    TableName: TABLE_NAME,
    Key: {
      'filename': { S: filename },
      'embedding_model': { S: embedding_model }
    }
  };
  const command = new DeleteItemCommand(params);
  try{
    await client.send(command);
    console.log('Item deleted successfully:');
    return true
  }catch(err){
    console.log('Error deleting item:', err);
    return false
  }
}


export const handler = async(event) => {
    // console.log(event);

    //获取所有文档
    if (event.httpMethod === 'GET' && event.resource === '/docs'){
        // const records = await scanTableData()
        const queryParams = event.queryStringParameters;
        const main_fun_arn = queryParams?.main_fun_arn === 'undefined' ? process.env.MAIN_FUN_ARN:queryParams.main_fun_arn;
        const apigateway_endpoint = queryParams?.apigateway_endpoint === 'undefined'? '':queryParams.apigateway_endpoint;
        const lambdaClient = new LambdaClient();
       
        if (apigateway_endpoint.length > 0){
          const options ={
            method:'POST',
            body:JSON.stringify({method:'get',resource:'docs'})
          }
            try {
                const response = await fetch(apigateway_endpoint,options);
                const ret = await response.json();
                console.log(JSON.stringify(ret));
                return {
                  statusCode: 200,
                  headers:cors_headers,
                  body:JSON.stringify(ret)
                }
            }catch(err){
              return {
                statusCode: 500,
                headers:cors_headers,
                body:JSON.stringify(err)
              }
            }
            
        }
        else if (main_fun_arn&&main_fun_arn.length >0){
          const params = {FunctionName: main_fun_arn,
                Payload:JSON.stringify({method:'get',resource:'docs'})}
          try {
              const response =await lambdaClient.send(new InvokeCommand(params));
              const payload = JSON.parse(Buffer.from(response.Payload).toString());
              console.log(JSON.stringify(payload));
            return {
              statusCode: 200,
              headers:cors_headers,
              body:JSON.stringify(payload)
            }
          }catch(err){  
            return {
              statusCode: 500,
              headers:cors_headers,
              body:JSON.stringify(err)
            }
          }
      }
  
    }else if (event.httpMethod === 'DELETE' && event.resource === '/docs'){
        const lambdaClient = new LambdaClient();
        const body = JSON.parse(event.body);
        const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
        const apigateway_endpoint = body.apigateway_endpoint|| '';

        if (apigateway_endpoint.length > 0){
          const options ={
            method:'POST',
            body:JSON.stringify({...body,method:'delete',resource:'docs'})
          }
            try {
                await fetch(apigateway_endpoint,options);
                return {
                  statusCode: 200,
                  headers:cors_headers,
                }
            }catch(err){
              return {
                statusCode: 500,
                headers:cors_headers,
                body:JSON.stringify(err)
              }
            }
            
        }
        else if (main_fun_arn&&main_fun_arn.length >0){
          const params = {FunctionName: main_fun_arn,
                Payload: JSON.stringify({...body,method:'delete',resource:'docs'})}

          try {
              await lambdaClient.send(new InvokeCommand(params));
            return {
              statusCode: 200,
              headers:cors_headers,
            }
          }catch(err){  
            return {
              statusCode: 500,
              headers:cors_headers,
              body:JSON.stringify(err)
            }
          }
      }
    }
    else if (event.httpMethod === 'GET' && event.resource === '/template'){
      const lambdaClient = new LambdaClient();
      const queryParams = event.queryStringParameters;
      const main_fun_arn = queryParams?.main_fun_arn === 'undefined' ? process.env.MAIN_FUN_ARN:queryParams.main_fun_arn;
      const apigateway_endpoint = queryParams?.apigateway_endpoint === 'undefined'? '':queryParams.apigateway_endpoint;
      const id = queryParams.id;
      // const apigateway_endpoint = queryParams.apigateway_endpoint;
      if (apigateway_endpoint.length > 0){
        const options ={
          method:'POST',
          body:JSON.stringify({method:'get',resource:'template',id:id})
        }
          try {
              const response = await fetch(apigateway_endpoint,options);
              const ret = await response.json();
              console.log(JSON.stringify(ret));
              return {
                statusCode: 200,
                headers:cors_headers,
                body:JSON.stringify(ret)
              }
          }catch(err){
            return {
              statusCode: 500,
              headers:cors_headers,
              body:JSON.stringify(err)
            }
          }
          
      }
      else if (main_fun_arn&&main_fun_arn.length >0){
        const params = {FunctionName: main_fun_arn,
              Payload:JSON.stringify({method:'get',resource:'template',id:id})}
        try {
            const response =await lambdaClient.send(new InvokeCommand(params));
            const payload = JSON.parse(Buffer.from(response.Payload).toString());
              console.log(JSON.stringify(payload));
          return {
            statusCode: 200,
            headers:cors_headers,
            body:JSON.stringify(payload)
          }
        }catch(err){  
          return {
            statusCode: 500,
            headers:cors_headers,
            body:JSON.stringify(err)
          }
        }
      }
  }
  else if (event.httpMethod === 'POST' && event.resource === '/template'){
    const lambdaClient = new LambdaClient();
    const body = JSON.parse(event.body);
    console.log(event.body);
    const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
    const apigateway_endpoint = body.apigateway_endpoint|| '';
    if (apigateway_endpoint.length > 0){
      const options ={
        method:'POST',
        body:JSON.stringify({method:'post',resource:'template',body:body})
      }
        try {
            const response = await fetch(apigateway_endpoint,options);
            const ret = await response.json();
            console.log(JSON.stringify(ret));
            return {
              statusCode: 200,
              headers:cors_headers,
              body:JSON.stringify(ret)
            }
        }catch(err){
          return {
            statusCode: 500,
            headers:cors_headers,
            body:JSON.stringify(err)
          }
        }
        
    }
    else if (main_fun_arn&&main_fun_arn.length >0){
      const params = {FunctionName: main_fun_arn,
            Payload:JSON.stringify({method:'post',resource:'template',body:body})}
      try {
          const response =await lambdaClient.send(new InvokeCommand(params));
          const payload = JSON.parse(Buffer.from(response.Payload).toString());
              console.log(JSON.stringify(payload));
        return {
          statusCode: 200,
          headers:cors_headers,
          body:JSON.stringify(payload)
        }
      }catch(err){  
        return {
          statusCode: 500,
          headers:cors_headers,
          body:JSON.stringify(err)
        }
      }
    }
}
else if (event.httpMethod === 'DELETE' && event.resource === '/template'){
  const lambdaClient = new LambdaClient();
  const body = JSON.parse(event.body);
  console.log(event.body);
  const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
  const apigateway_endpoint = body.apigateway_endpoint|| '';
  if (apigateway_endpoint.length > 0){
    const options ={
      method:'POST',
      body:JSON.stringify({method:'delete',resource:'template',body:body})
    }
      try {
          const response = await fetch(apigateway_endpoint,options);
          const ret = await response.json();
          console.log(JSON.stringify(ret));
          return {
            statusCode: 200,
            headers:cors_headers,
            body:JSON.stringify(ret)
          }
      }catch(err){
        return {
          statusCode: 500,
          headers:cors_headers,
          body:JSON.stringify(err)
        }
      }
      
  }
  else if (main_fun_arn&&main_fun_arn.length >0){
    const params = {FunctionName: main_fun_arn,
          Payload:JSON.stringify({method:'delete',resource:'template',body:body})}
    try {
        const response =await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
            console.log(JSON.stringify(payload));
      return {
        statusCode: 200,
        headers:cors_headers,
        body:JSON.stringify(payload)
      }
    }catch(err){  
      return {
        statusCode: 500,
        headers:cors_headers,
        body:JSON.stringify(err)
      }
    }
  }
}
}
