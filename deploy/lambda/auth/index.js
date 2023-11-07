// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const jwt = require("jsonwebtoken");
// const { CognitoIdentityProviderClient, GetUserCommand }  = require('@aws-sdk/client-cognito-identity-provider');
// const { fromCognitoIdentityPool}  = require('@aws-sdk/credential-provider-cognito-identity');

// const client = new CognitoIdentityProviderClient({
//   credentials: fromCognitoIdentityPool({
//     identityPoolId: process.env.IDENTITY_POOL_ID??"us-west-2_DacBygbuZ",
//   }),
// });

const formatResponse =(isAuthorized,errormsg) =>{
  const response = {
      "isAuthorized": isAuthorized,
      "context": {
          "message": errormsg,
      }
  }
  return response;
}

function generatePolicy(principalId, effect, resource) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    }
  };
}


exports.handler  = async (event) => {
  const token = event.authorizationToken;
  let username;
  if (!token) {
      return generatePolicy('user', 'Deny', event.methodArn); 
   }
  //  try {
  //   username = jwt.verify(token.split(' ')[1], process.env.TOKEN_KEY);
  //   const command = new GetUserCommand({ AccessToken: token.split(" ")[1]});
  //   const response = await client.send(command);
  //   username = response.Username;

  //   // Process the user data as needed
  //   console.log("login User:", username);
  //   return generatePolicy(username, 'Allow', event.methodArn)
  // } catch (err) {
  //   console.error("Error:", err);
  //   return generatePolicy('user', 'Deny', event.methodArn);
  // }
  try {
    username = jwt.verify(token.split(' ')[1], process.env.TOKEN_KEY);
  } catch (err) {
    console.error(err)
    return generatePolicy('user', 'Deny', event.methodArn);
  }
  console.log(`${username}:auth pass`)
  return generatePolicy(username.username, 'Allow', event.methodArn);
}
