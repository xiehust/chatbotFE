// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import jwt from "jsonwebtoken";
// import {
//   CognitoIdentityProviderClient,
//   GetUserCommand,
// } from "@aws-sdk/client-cognito-identity-provider";
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

// const client = new CognitoIdentityProviderClient({
//   credentials: fromCognitoIdentityPool({
//     identityPoolId: process.env.IDENTITY_POOL_ID??"us-west-2_DacBygbuZ",
//   }),
// });


export const handler = async (event) => {
  const token = event.queryStringParameters.token;
  console.log(token);
  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify("Invalid Token"),
    };
  }
  // try {
  //   const command = new GetUserCommand({ AccessToken: token.split(" ")[1]});
  //   const response = await client.send(command);
  //   const user = response.Username;

  //   // Process the user data as needed
  //   console.log("login User:", user);
  // } catch (err) {
  //   console.error("Error:", err);
  //       return {
  //     statusCode: 400,
  //     body: JSON.stringify(err),
  //   };
  // }


  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.TOKEN_KEY);
    //   username = decoded;
    console.log("success");
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify(err),
    };
  }
  return {
    statusCode: 200,
  };
};
