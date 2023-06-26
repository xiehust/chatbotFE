// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { DynamoDBClient, ScanCommand,DeleteItemCommand } from "@aws-sdk/client-dynamodb";

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
    console.log(event)
    if (event.httpMethod === 'GET' && event.resource === '/docs'){
        const records = await scanTableData()
        return {
          statusCode: 200,
          headers:cors_headers,
          body:JSON.stringify(records)
        }
    }else if (event.httpMethod === 'DELETE' && event.resource === '/docs'){
        const ret = await deleteItem()
        if (ret){
          //to add call remote call, 
        }
    }
};
