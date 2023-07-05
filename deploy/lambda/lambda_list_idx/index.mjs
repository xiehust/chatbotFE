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
    console.log(event);
    if (event.httpMethod === 'GET' && event.resource === '/docs'){
        // const records = await scanTableData()
        const lambdaClient = new LambdaClient();
        const queryParams = event.queryStringParameters;
        const main_fun_arn = queryParams.main_fun_arn;
        const apigateway_endpoint = queryParams.apigateway_endpoint;
        if (apigateway_endpoint.length > 0){
          const options ={
            method:'POST',
            body:JSON.stringify({method:'get'})
          }
            try {
                const response = await fetch(apigateway_endpoint,options);
                const ret = await response.json();
                console.log(ret);
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
        else if (main_fun_arn.length >0){
          const params = {FunctionName: main_fun_arn,
                Payload:{method:'get'}}
          try {
              const response =await lambdaClient.send(new InvokeCommand(params));
            return {
              statusCode: 200,
              headers:cors_headers,
              body:JSON.stringify(response)
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
        const main_fun_arn = body.main_fun_arn;
        const apigateway_endpoint = body.apigateway_endpoint;

        if (apigateway_endpoint.length > 0){
          const options ={
            method:'POST',
            body:JSON.stringify({...body,method:'delete'})
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
        else if (main_fun_arn.length >0){
          const params = {FunctionName: main_fun_arn,
                Payload:{...body,method:'delete'}}

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
}
