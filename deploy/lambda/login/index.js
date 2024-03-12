// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const jwt = require( "jsonwebtoken");
const bcryptjs = require("bcryptjs");
const { DynamoDBClient, GetItemCommand ,ScanCommand}  = require('@aws-sdk/client-dynamodb');


const queryDynamoDb = async (key) => {
  const client = new DynamoDBClient();
  const params = {
    Key: { username: { S: key } },
    TableName: process.env.USER_TABLE_NAME,
  };
  const command = new GetItemCommand(params);
  try {
    const results = await client.send(command);
    console.log(results);
    if (!results.Item) {
      return null;
    } else {
      console.log(results.Item);
      return {password:results.Item.password.S,
        group:results.Item.groupname.S,
      company:results.Item.company.S};
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

const createToken = (payload) => {
  return jwt.sign({ payload: payload }, process.env.TOKEN_KEY, {
    expiresIn: "7200h",
  });
};

const comparePassword = async (plaintextPassword, hash) => {
  const result = await bcryptjs.compare(plaintextPassword, hash);
  return result;
};

const formatResponse = (code, errormsg, token) => {
  const response = {
    statusCode:code,
    headers: {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,POST,DELETE"
  },
    body: JSON.stringify({
      isAuthorized:false,
      message: errormsg,
      token: token,
    }),
  };
  return response;
};



exports.handler  = async (event) => {
  console.log(event)
  const authorization = event.headers?event.headers.Authorization.split(':'):undefined;
  if (!authorization) 
    return  formatResponse(400, "Missing auth headers", "");
  const user_name = authorization[0];
  const plain_user_pwd = authorization[1];
  //query user in DB
  const {password,group,company} = await queryDynamoDb(user_name);
    
   //if user is not found, return 403
   if (!password) {
    return formatResponse(403, "User not found", "");
  }

  //if the password is not match, return 403
  // if ( !comparePassword(plain_user_pwd,password)) {
    if (plain_user_pwd !== password) {
    return formatResponse(403, "Invalid credential", "");
  }

  //create jwt token
  const token = createToken(user_name);
  
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers" :  "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,POST,DELETE"
  },
    body: JSON.stringify({
      isAuthorized:true,
      token: token,
      username:user_name,
      groupname:group,
      company:company
    }),
  };
  return response;
};
